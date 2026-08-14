import type { ChartTooltipInput, ChartValue } from '@tanstack/charts'
import { tooltip as tooltipExtension } from '@tanstack/charts/tooltip'
import { useChartConfiguration } from './provider.js'

export interface ChartFormatters {
  readonly date: (value: Date) => string
  readonly axisDate: (value: Date, interval: number) => string
  readonly axisNumber: (value: number) => string
  readonly number: (value: number) => string
  readonly value: (value: ChartValue) => string
}

const dayMilliseconds = 24 * 60 * 60 * 1000
const monthIntervalThreshold = 27 * dayMilliseconds
const dateTimeIntervalThreshold = 7 * dayMilliseconds
const secondIntervalThreshold = 10 * 60 * 1000
const maximumDateTicks = 12

export function useChartFormatters(): ChartFormatters {
  const { locale, timeZone } = useChartConfiguration()
  const minuteFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
  const secondFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
  const millisecondFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    timeZone,
    timeZoneName: 'short',
  })
  const singleDateFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  })
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone,
  })
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
  const secondAxisFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  })
  const millisecondAxisFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    timeZone,
  })
  const axisTimeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    timeZone,
  })
  const axisNumberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 })
  const numberFormatter = new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 })
  const date = (value: Date) => {
    if (value.getUTCMilliseconds() !== 0) return millisecondFormatter.format(value)
    if (value.getUTCSeconds() !== 0) return secondFormatter.format(value)
    return minuteFormatter.format(value)
  }
  const axisDate = (value: Date, interval: number) => {
    if (interval >= monthIntervalThreshold) return monthFormatter.format(value)
    const parts = Object.fromEntries(axisTimeParts.formatToParts(value).map((part) => [part.type, part.value]))
    const isMidnight = Number(parts.hour) % 24 === 0
      && Number(parts.minute) === 0
      && Number(parts.second) === 0
    if (isMidnight) return singleDateFormatter.format(value)
    if (interval === 0) {
      if (value.getUTCMilliseconds() !== 0) return millisecondAxisFormatter.format(value)
      if (value.getUTCSeconds() !== 0) return secondAxisFormatter.format(value)
      return dateTimeFormatter.format(value)
    }
    if (interval < 1000) return millisecondAxisFormatter.format(value)
    if (interval < secondIntervalThreshold) return secondAxisFormatter.format(value)
    if (interval < dateTimeIntervalThreshold) return dateTimeFormatter.format(value)
    return singleDateFormatter.format(value)
  }
  const axisNumber = (value: number) => axisNumberFormatter.format(value)
  const number = (value: number) => numberFormatter.format(value)
  const value = (input: ChartValue) => input instanceof Date ? date(input) : typeof input === 'number' ? number(input) : input
  return { date, axisDate, axisNumber, number, value }
}

export function dateAxis(label: string | undefined, formatters: ChartFormatters, dates: readonly Date[]) {
  const timestamps = [...new Set(dates.map((date) => date.getTime()))].sort((left, right) => left - right)
  const selected = timestamps.length <= maximumDateTicks
    ? timestamps
    : Array.from({ length: maximumDateTicks }, (_, index) =>
        timestamps[Math.round(index * (timestamps.length - 1) / (maximumDateTicks - 1))]!)
  let interval = 0
  if (selected.length > 1) {
    interval = Number.POSITIVE_INFINITY
    for (let index = 1; index < selected.length; index += 1) {
      interval = Math.min(interval, selected[index]! - selected[index - 1]!)
    }
  }
  const values = selected.map((timestamp) => new Date(timestamp))
  const compactLabels = values.map((value) => formatters.axisDate(value, interval))
  const labels = new Set(compactLabels).size === compactLabels.length
    ? compactLabels
    : values.map(formatters.date)
  const labelsByTimestamp = new Map(values.map((value, index) => [value.getTime(), labels[index]!]))
  return {
    ticks: {
      values,
      format: (value: Date) => labelsByTimestamp.get(value.getTime()) ?? formatters.date(value),
    },
    ...(label === undefined ? {} : { label }),
  }
}

export function numberAxis(label: string | undefined, formatters: ChartFormatters) {
  return { ticks: { format: formatters.axisNumber }, ...(label === undefined ? {} : { label }) }
}

export function localizedTooltip(
  enabled: boolean | undefined,
  formatters: ChartFormatters,
  readout?: string,
): ChartTooltipInput<any, any, any, 'dom'> | undefined {
  if (enabled === false) return undefined
  return {
    use: tooltipExtension,
    format: (point) => readout ?? `${formatters.value(point.xValue)}: ${formatters.value(point.yValue)}`,
  }
}
