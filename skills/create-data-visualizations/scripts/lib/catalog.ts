import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CliInputError, diagnostic, ServiceUnavailableError, type Diagnostic } from './contracts'

export const defaultCatalogUrl = 'http://127.0.0.1:6006/'

const maxResponseBytes = 5 * 1024 * 1024
const storyIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)+$/

export type CatalogStory = {
  id: string
  name: string
  title: string
  description?: string
}

export type CatalogTestResult = {
  repo: string
  passed: string[]
  skipped: string[]
  failed: { id: string; messages: string[] }[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const catalogUrl = (value: string) => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new CliInputError('The catalog URL must be a valid URL.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new CliInputError('The catalog URL must use HTTP or HTTPS.')
  const loopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)
  if (!loopback && process.env.APERTURE_CATALOG_ALLOW_REMOTE !== '1') {
    throw new CliInputError('A remote catalog requires APERTURE_CATALOG_ALLOW_REMOTE=1.')
  }
  url.search = ''
  url.hash = ''
  if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`
  return url.toString()
}

export const validateStoryIds = (ids: string[]) => {
  const invalid = ids.filter((id) => !storyIdPattern.test(id))
  if (invalid.length) throw new CliInputError(`Invalid story IDs: ${invalid.join(', ')}. Use IDs from catalog list.`)
  if (new Set(ids).size !== ids.length) throw new CliInputError('Each story ID must appear once.')
}

const readBounded = async (response: Response) => {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxResponseBytes) throw new ServiceUnavailableError('The catalog meta.json exceeds 5 MiB.')
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
      throw new ServiceUnavailableError('The catalog meta.json exceeds 5 MiB.')
    }
    body += decoder.decode(value, { stream: true })
  }
  return body + decoder.decode()
}

/** Reads the story index that Ladle serves at meta.json. */
export const listCatalogStories = async (url: string): Promise<CatalogStory[]> => {
  let response: Response
  try {
    response = await fetch(new URL('meta.json', url), { redirect: 'error', signal: AbortSignal.timeout(30_000) })
  } catch (error) {
    throw new ServiceUnavailableError(`The catalog is not reachable at ${url}: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!response.ok) throw new ServiceUnavailableError(`The catalog meta.json returned HTTP ${response.status}.`)
  let meta: unknown
  try {
    meta = JSON.parse(await readBounded(response))
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error
    throw new ServiceUnavailableError(`The catalog meta.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!isRecord(meta) || !isRecord(meta.stories)) throw new ServiceUnavailableError('The catalog meta.json has no stories object.')
  return Object.entries(meta.stories).map(([id, story]) => {
    if (!isRecord(story) || typeof story.name !== 'string' || !Array.isArray(story.levels) || !story.levels.every((level) => typeof level === 'string')) {
      throw new ServiceUnavailableError(`The catalog meta.json has a malformed story: ${id}.`)
    }
    const description = isRecord(story.meta) && typeof story.meta.description === 'string' ? story.meta.description : undefined
    return { id, name: story.name, title: story.levels.join('/'), ...(description === undefined ? {} : { description }) }
  })
}

export const previewStories = async (url: string, ids: string[]) => {
  validateStoryIds(ids)
  const stories = await listCatalogStories(url)
  const known = new Set(stories.map((story) => story.id))
  const unknown = ids.filter((id) => !known.has(id))
  if (unknown.length) throw new CliInputError(`The catalog has no stories with IDs: ${unknown.join(', ')}.`)
  return ids.map((id) => ({
    id,
    url: `${url}?story=${id}`,
    isolatedUrl: `${url}?story=${id}&mode=preview`,
  }))
}

const catalogDirectory = async (repo: string) => {
  const directory = resolve(repo, 'apps/catalog')
  let manifest: unknown
  try {
    manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  } catch {
    throw new CliInputError(`${repo} is not an Aperture checkout. Pass the repository root with --repo.`)
  }
  if (!isRecord(manifest) || manifest.name !== '@aperture/catalog') {
    throw new CliInputError(`${directory} is not the Aperture catalog.`)
  }
  return directory
}

/** Runs the catalog story tests: render, accessibility checks, and interaction plays. */
export const testStories = async (repo: string, ids: string[]): Promise<{ result: CatalogTestResult; diagnostics: Diagnostic[] }> => {
  validateStoryIds(ids)
  const directory = await catalogDirectory(repo)
  const reportDirectory = await mkdtemp(join(tmpdir(), 'aperture-catalog-test-'))
  const reportFile = join(reportDirectory, 'report.json')
  try {
    // Story IDs contain only lowercase letters, digits, and hyphens, so the filter needs no escaping.
    const filter = ids.length ? ['-t', `^(${ids.join('|')})$`] : []
    let child: ReturnType<typeof Bun.spawn>
    try {
      child = Bun.spawn(['pnpm', 'exec', 'vitest', 'run', '--reporter=json', `--outputFile=${reportFile}`, ...filter], {
        cwd: directory,
        stdout: 'ignore',
        stderr: 'pipe',
      })
    } catch (error) {
      throw new ServiceUnavailableError(`pnpm could not start the story tests: ${error instanceof Error ? error.message : String(error)}`)
    }
    const stderr = await new Response(child.stderr as ReadableStream<Uint8Array>).text()
    const exitCode = await child.exited
    const reportExists = await stat(reportFile).then(() => true, () => false)
    if (!reportExists) throw new ServiceUnavailableError(`The story tests produced no report. Exit code ${exitCode}. ${stderr.slice(-2000)}`)
    const report: unknown = JSON.parse(await readFile(reportFile, 'utf8'))
    if (!isRecord(report) || !Array.isArray(report.testResults)) throw new ServiceUnavailableError('The story test report is malformed.')
    const result: CatalogTestResult = { repo: resolve(repo), passed: [], skipped: [], failed: [] }
    for (const file of report.testResults) {
      if (!isRecord(file) || !Array.isArray(file.assertionResults)) throw new ServiceUnavailableError('The story test report is malformed.')
      if (file.status === 'failed' && file.assertionResults.length === 0) {
        result.failed.push({ id: '(test file)', messages: [typeof file.message === 'string' ? file.message : 'The story test file failed to load.'] })
      }
      for (const assertion of file.assertionResults) {
        if (!isRecord(assertion) || typeof assertion.title !== 'string') throw new ServiceUnavailableError('The story test report is malformed.')
        if (assertion.status === 'passed') result.passed.push(assertion.title)
        else if (assertion.status === 'failed') {
          const messages = Array.isArray(assertion.failureMessages) ? assertion.failureMessages.map(String) : []
          result.failed.push({ id: assertion.title, messages })
        } else result.skipped.push(assertion.title)
      }
    }
    const ran = new Set([...result.passed, ...result.failed.map((failure) => failure.id), ...result.skipped])
    const missing = ids.filter((id) => !ran.has(id))
    // The test-name filter reports every other story as skipped. Keep only stories that were requested.
    if (ids.length) result.skipped = result.skipped.filter((id) => ids.includes(id))
    const diagnostics: Diagnostic[] = [
      ...missing.map((id) => diagnostic('error', 'CATALOG_UNKNOWN_STORY', '$.ids', `No story test has the ID ${id}.`)),
      ...result.failed.map((failure) => diagnostic('error', 'CATALOG_TEST_FAILURE', `$.failed.${failure.id}`, failure.messages.join('\n') || 'The story test failed.')),
    ]
    if (exitCode !== 0 && diagnostics.length === 0) {
      diagnostics.push(diagnostic('error', 'CATALOG_TEST_RUN', '$', `The story tests exited with code ${exitCode}. ${stderr.slice(-2000)}`))
    }
    return { result, diagnostics }
  } finally {
    await rm(reportDirectory, { recursive: true, force: true })
  }
}
