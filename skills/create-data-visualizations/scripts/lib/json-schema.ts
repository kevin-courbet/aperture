import { diagnostic, type Diagnostic } from './contracts'

type Schema = Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const typeMatches = (value: unknown, type: string) => {
  switch (type) {
    case 'object': return isRecord(value)
    case 'array': return Array.isArray(value)
    case 'string': return typeof value === 'string'
    case 'number': return typeof value === 'number' && Number.isFinite(value)
    case 'integer': return Number.isInteger(value)
    case 'boolean': return typeof value === 'boolean'
    case 'null': return value === null
    default: return false
  }
}

const childPath = (path: string, key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`

const isRfc3339Date = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day] = match
  const monthNumber = Number(month)
  const dayNumber = Number(day)
  const maxDay = new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate()
  return monthNumber >= 1 && monthNumber <= 12 && dayNumber >= 1 && dayNumber <= maxDay
}

const isRfc3339DateTime = (value: string) => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) return false
  const [, date, hour, minute, second, zone] = match
  if (!isRfc3339Date(date)) return false
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false
  if (zone !== 'Z') {
    const [zoneHour, zoneMinute] = zone.slice(1).split(':').map(Number)
    if (zoneHour > 14 || zoneMinute > 59 || (zoneHour === 14 && zoneMinute !== 0)) return false
  }
  return true
}

const validateNode = (value: unknown, schema: Schema, path: string): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((branch) =>
      isRecord(branch) && validateNode(value, branch, path).length === 0,
    )
    if (matches.length !== 1) {
      return [diagnostic('error', 'SCHEMA_ONE_OF', path, `Value must match exactly one allowed shape; matched ${matches.length}.`)]
    }
    return diagnostics
  }

  if ('const' in schema && !Object.is(value, schema.const)) {
    diagnostics.push(diagnostic('error', 'SCHEMA_CONST', path, `Value must equal ${JSON.stringify(schema.const)}.`))
    return diagnostics
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => Object.is(item, value))) {
    diagnostics.push(diagnostic('error', 'SCHEMA_ENUM', path, `Value must be one of: ${schema.enum.map(String).join(', ')}.`))
    return diagnostics
  }

  const types = typeof schema.type === 'string'
    ? [schema.type]
    : Array.isArray(schema.type) ? schema.type.filter((type): type is string => typeof type === 'string') : []
  if (types.length && !types.some((type) => typeMatches(value, type))) {
    diagnostics.push(diagnostic('error', 'SCHEMA_TYPE', path, `Expected ${types.join(' or ')}.`))
    return diagnostics
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      diagnostics.push(diagnostic('error', 'SCHEMA_MINIMUM', path, `Number must be at least ${schema.minimum}.`))
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      diagnostics.push(diagnostic('error', 'SCHEMA_MAXIMUM', path, `Number must be at most ${schema.maximum}.`))
    }
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      diagnostics.push(diagnostic('error', 'SCHEMA_MIN_LENGTH', path, `String must contain at least ${schema.minLength} character(s).`))
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) {
      diagnostics.push(diagnostic('error', 'SCHEMA_PATTERN', path, `String must match ${schema.pattern}.`))
    }
    if (schema.format === 'date-time' && !isRfc3339DateTime(value)) {
      diagnostics.push(diagnostic('error', 'SCHEMA_DATE_TIME', path, 'Provide a valid date-time string.'))
    }
    if (schema.format === 'date' && !isRfc3339Date(value)) {
      diagnostics.push(diagnostic('error', 'SCHEMA_DATE', path, 'Provide a valid date string.'))
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      diagnostics.push(diagnostic('error', 'SCHEMA_MIN_ITEMS', path, `Array must contain at least ${schema.minItems} item(s).`))
    }
    if (isRecord(schema.items)) {
      value.forEach((item, index) => diagnostics.push(...validateNode(item, schema.items as Schema, `${path}[${index}]`)))
    }
  }

  if (isRecord(value)) {
    const required = Array.isArray(schema.required)
      ? schema.required.filter((key): key is string => typeof key === 'string')
      : []
    for (const key of required) {
      if (!(key in value)) diagnostics.push(diagnostic('error', 'SCHEMA_REQUIRED', childPath(path, key), 'Required property is missing.'))
    }
    if (typeof schema.minProperties === 'number' && Object.keys(value).length < schema.minProperties) {
      diagnostics.push(diagnostic('error', 'SCHEMA_MIN_PROPERTIES', path, `Object must contain at least ${schema.minProperties} property or properties.`))
    }
    const properties = isRecord(schema.properties) ? schema.properties : {}
    for (const [key, child] of Object.entries(value)) {
      const childSchema = properties[key]
      if (isRecord(childSchema)) {
        diagnostics.push(...validateNode(child, childSchema, childPath(path, key)))
      } else if (schema.additionalProperties === false) {
        diagnostics.push(diagnostic('error', 'SCHEMA_ADDITIONAL_PROPERTY', childPath(path, key), 'Property is not allowed.'))
      } else if (isRecord(schema.additionalProperties)) {
        diagnostics.push(...validateNode(child, schema.additionalProperties, childPath(path, key)))
      }
    }
  }
  return diagnostics
}

export const validateJsonSchema = (value: unknown, schema: unknown): Diagnostic[] =>
  isRecord(schema)
    ? validateNode(value, schema, '$')
    : [diagnostic('error', 'SCHEMA_INVALID', '$', 'The bundled JSON Schema is invalid.')]
