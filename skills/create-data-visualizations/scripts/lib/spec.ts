import { diagnostic, type Diagnostic } from './contracts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCalendarDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return parsed.getUTCFullYear() === Number(match[1])
    && parsed.getUTCMonth() + 1 === Number(match[2])
    && parsed.getUTCDate() === Number(match[3])
}

const isDateTime = (value: string) => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-](\d{2}):(\d{2}))$/.exec(value)
  if (!match || !isCalendarDate(match[1])) return false
  const hour = Number(match[2])
  const minute = Number(match[3])
  const second = Number(match[4] ?? 0)
  const offsetHour = Number(match[6] ?? 0)
  const offsetMinute = Number(match[7] ?? 0)
  if (hour > 23 || minute > 59 || second > 59 || offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false
  return !Number.isNaN(Date.parse(value))
}

const isTemporalValue = (value: unknown) => {
  if (typeof value !== 'string') return false
  const month = /^(\d{4})-(\d{2})$/.exec(value)
  return month
    ? Number(month[2]) >= 1 && Number(month[2]) <= 12
    : isCalendarDate(value) || isDateTime(value)
}

export const validateSpecSemantics = (value: unknown): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  if (!isRecord(value)) return diagnostics
  const context = isRecord(value.context) ? value.context : undefined
  if (typeof context?.locale === 'string') {
    try {
      if (Intl.NumberFormat.supportedLocalesOf([context.locale]).length !== 1) {
        diagnostics.push(diagnostic('error', 'SPEC_LOCALE', '$.context.locale', 'Provide a supported BCP 47 locale.'))
      }
    } catch {
      diagnostics.push(diagnostic('error', 'SPEC_LOCALE', '$.context.locale', 'Provide a valid BCP 47 locale.'))
    }
  }
  if (typeof context?.timeZone === 'string') {
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: context.timeZone })
    } catch {
      diagnostics.push(diagnostic('error', 'SPEC_TIME_ZONE', '$.context.timeZone', 'Provide a valid IANA time zone.'))
    }
  }
  const metric = isRecord(value.metric) ? value.metric : undefined
  if (metric?.unit === 'percent' && (typeof metric.denominator !== 'string' || metric.denominator.trim() === '')) {
    diagnostics.push(diagnostic('error', 'SPEC_DENOMINATOR', '$.metric.denominator', 'Percentage metrics require a denominator.'))
  }
  const data = isRecord(value.data) ? value.data : undefined
  const chart = isRecord(value.chart) ? value.chart : undefined
  if (chart && data?.state === 'ready' && Array.isArray(data.rows)) {
    if (data.rows.length === 1 && !['result', 'table'].includes(String(chart.family))) {
      diagnostics.push(diagnostic('error', 'SPEC_SINGLE_RESULT', '$.chart.family', 'Use result or table for one observation; do not imply a trend.'))
    }
  }
  if (data?.state === 'ready' && Array.isArray(data.rows) && Array.isArray(value.encodings)) {
    value.encodings.forEach((encoding, index) => {
      const path = `$.encodings[${index}]`
      if (!isRecord(encoding) || typeof encoding.field !== 'string') return
      const values = data.rows.filter(isRecord).map((row) => row[encoding.field as string])
      if (values.some((fieldValue) => fieldValue === undefined)) {
        diagnostics.push(diagnostic('error', 'SPEC_ENCODING_FIELD', `${path}.field`, `Field ${encoding.field} is absent from one or more ready rows.`))
      }
      if (encoding.fieldType === 'quantitative' && values.some((fieldValue) => fieldValue !== null && typeof fieldValue !== 'number')) {
        diagnostics.push(diagnostic('error', 'SPEC_QUANTITATIVE_FIELD', `${path}.field`, 'Quantitative fields must contain only numbers or null.'))
      }
      if (encoding.fieldType === 'temporal' && values.some((fieldValue) => fieldValue !== null && !isTemporalValue(fieldValue))) {
        diagnostics.push(diagnostic('error', 'SPEC_TEMPORAL_FIELD', `${path}.field`, 'Temporal fields must use ISO year-month, date, or date-time values with an explicit offset.'))
      }
    })
  }
  const provenance = isRecord(value.provenance) ? value.provenance : undefined
  const freshness = isRecord(provenance?.freshness) ? provenance.freshness : undefined
  if (freshness?.state === 'known' && typeof freshness.asOf === 'string' && !isCalendarDate(freshness.asOf) && !isDateTime(freshness.asOf)) {
    diagnostics.push(diagnostic('error', 'SPEC_FRESHNESS', '$.provenance.freshness.asOf', 'Known freshness must use an ISO date or a date-time with an explicit offset.'))
  }
  return diagnostics
}
