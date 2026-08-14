import { CliInputError, diagnostic, ServiceUnavailableError, type Diagnostic } from './contracts'

type JsonRpcResponse = {
  error?: { code: number; message: string; data?: unknown }
  result?: unknown
}

type StorybookCall = {
  result: unknown
  diagnostics: Diagnostic[]
}

const maxResponseBytes = 5 * 1024 * 1024

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateUrl = (value: string) => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new CliInputError('Storybook MCP URL must be a valid URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new CliInputError('Storybook MCP URL must use HTTP or HTTPS.')
  const loopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)
  if (!loopback && process.env.APERTURE_MCP_ALLOW_REMOTE !== '1') {
    throw new CliInputError('Remote Storybook MCP endpoints require APERTURE_MCP_ALLOW_REMOTE=1.')
  }
  return url.toString()
}

const readBounded = async (response: Response) => {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxResponseBytes) throw new ServiceUnavailableError('Storybook MCP response exceeds 5 MiB.')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let body = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > maxResponseBytes) {
      await reader.cancel()
      throw new ServiceUnavailableError('Storybook MCP response exceeds 5 MiB.')
    }
    body += decoder.decode(value, { stream: true })
  }
  return body + decoder.decode()
}

const parseResponse = (body: string, contentType: string | null): JsonRpcResponse => {
  try {
    if (contentType?.toLowerCase().includes('application/json')) return JSON.parse(body) as JsonRpcResponse
  } catch (error) {
    throw new ServiceUnavailableError(`Storybook MCP returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  const data = body
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .find(Boolean)
  if (!data) throw new ServiceUnavailableError('Storybook MCP returned no JSON-RPC event data.')
  try {
    return JSON.parse(data) as JsonRpcResponse
  } catch (error) {
    throw new ServiceUnavailableError(`Storybook MCP returned invalid event data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const request = async (
  url: string,
  method: 'POST' | 'DELETE',
  payload: unknown,
  timeout: number,
  session?: string,
) => {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      redirect: 'error',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...(session ? { 'mcp-session-id': session } : {}),
      },
      ...(method === 'POST' ? { body: JSON.stringify(payload) } : {}),
      signal: AbortSignal.timeout(timeout),
    })
  } catch (error) {
    throw new ServiceUnavailableError(`Storybook MCP request failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!response.ok) throw new ServiceUnavailableError(`Storybook MCP returned HTTP ${response.status}.`)
  return { response, body: await readBounded(response) }
}

const resultText = (result: Record<string, unknown>) =>
  Array.isArray(result.content)
    ? result.content
      .filter(isRecord)
      .filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text as string)
      .join('\n')
    : ''

const validateToolResult = (tool: string | undefined, result: unknown): Diagnostic[] => {
  if (!isRecord(result)) return [diagnostic('error', 'STORYBOOK_RESULT', '$.result', 'Storybook returned a malformed tool result.')]
  if (result.isError === true) return [diagnostic('error', 'STORYBOOK_TOOL_ERROR', '$.result', resultText(result) || 'Storybook tool failed.')]
  const text = resultText(result)
  if (tool === 'run-story-tests') {
    if (/^No stories found matching/m.test(text)) return [diagnostic('error', 'STORYBOOK_NO_STORIES', '$.result', text)]
    for (const section of ['## Failing Stories', '## Accessibility Violations', '## Unhandled Errors']) {
      if (text.includes(section)) return [diagnostic('error', 'STORYBOOK_TEST_FAILURE', '$.result', text)]
    }
    if (!text.includes('## Passing Stories')) return [diagnostic('error', 'STORYBOOK_TEST_RESULT', '$.result', 'Storybook returned no passing story results.')]
  }
  if (tool === 'preview-stories') {
    const structured = isRecord(result.structuredContent) ? result.structuredContent : undefined
    const stories = Array.isArray(structured?.stories) ? structured.stories : []
    if (stories.length === 0) return [diagnostic('error', 'STORYBOOK_PREVIEW_EMPTY', '$.result', 'Storybook returned no preview stories.')]
    const failed = stories.filter((story) => isRecord(story) && typeof story.error === 'string')
    if (failed.length) return [diagnostic('error', 'STORYBOOK_PREVIEW_FAILURE', '$.result', failed.map((story) => story.error).join('\n'))]
  }
  return []
}

export const callStorybook = async (
  value: string,
  tool?: string,
  args: Record<string, unknown> = {},
): Promise<StorybookCall> => {
  const url = validateUrl(value)
  let session: string | undefined
  try {
    const initialized = await request(url, 'POST', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'create-data-visualizations-cli', version: '1.0.0' },
      },
    }, 30_000)
    session = initialized.response.headers.get('mcp-session-id') ?? undefined
    if (!session) throw new ServiceUnavailableError('Storybook MCP did not return a session identifier.')
    const initResult = parseResponse(initialized.body, initialized.response.headers.get('content-type'))
    if (initResult.error) throw new ServiceUnavailableError(`Storybook MCP initialization failed: ${initResult.error.message}`)

    await request(url, 'POST', { jsonrpc: '2.0', method: 'notifications/initialized' }, 30_000, session)
    const listed = await request(url, 'POST', { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, 60_000, session)
    const listResponse = parseResponse(listed.body, listed.response.headers.get('content-type'))
    if (listResponse.error) throw new ServiceUnavailableError(`Storybook MCP tool discovery failed: ${listResponse.error.message}`)
    if (!tool) return { result: listResponse.result, diagnostics: validateToolResult(undefined, listResponse.result) }
    const listResult = isRecord(listResponse.result) ? listResponse.result : undefined
    const tools = Array.isArray(listResult?.tools) ? listResult.tools : []
    const names = tools.filter(isRecord).map((item) => item.name).filter((name): name is string => typeof name === 'string')
    if (!names.includes(tool)) throw new ServiceUnavailableError(`Storybook MCP does not provide required tool ${tool}.`)
    const payload = { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: tool, arguments: args } }
    const called = await request(url, 'POST', payload, tool === 'run-story-tests' ? 600_000 : 60_000, session)
    const response = parseResponse(called.body, called.response.headers.get('content-type'))
    if (response.error) throw new ServiceUnavailableError(`Storybook MCP tool call failed: ${response.error.message}`)
    return { result: response.result, diagnostics: validateToolResult(tool, response.result) }
  } finally {
    if (session) {
      try {
        await request(url, 'DELETE', null, 10_000, session)
      } catch {
        // Session cleanup must not replace the command result.
      }
    }
  }
}
