export const resultSchemaVersion = '1.0' as const

export type Severity = 'error' | 'warning' | 'info'

export type Diagnostic = {
  severity: Severity
  code: string
  path: string
  message: string
}

export type CommandResult = {
  schemaVersion: typeof resultSchemaVersion
  command: string
  ok: boolean
  data: unknown
  diagnostics: Diagnostic[]
}

export class CliInputError extends Error {
  override readonly name = 'CliInputError'
}

export class ServiceUnavailableError extends Error {
  override readonly name = 'ServiceUnavailableError'
}

export const diagnostic = (
  severity: Severity,
  code: string,
  path: string,
  message: string,
): Diagnostic => ({ severity, code, path, message })

export const commandResult = (
  command: string,
  data: unknown,
  diagnostics: Diagnostic[] = [],
): CommandResult => ({
  schemaVersion: resultSchemaVersion,
  command,
  ok: !diagnostics.some(({ severity }) => severity === 'error'),
  data,
  diagnostics,
})
