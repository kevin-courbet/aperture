import type { ChartTooltipInput, ChartValue } from '@tanstack/charts'
import { tooltip as tooltipExtension } from '@tanstack/charts/tooltip'
import { useChartConfiguration } from './provider.js'

export interface ChartFormatters {
  readonly date: (value: Date) => string
  readonly axisNumber: (value: number) => string
  readonly number: (value: number) => string
  readonly value: (value: ChartValue) => string
}

export function useChartFormatters(): ChartFormatters {
  const { locale, timeZone } = useChartConfiguration()
  const minuteFormatter = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
  const secondFormatter = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
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
    calendar: 'gregory',
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
  const axisNumberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 })
  const numberFormatter = new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 })
  const date = (value: Date) => {
    if (value.getUTCMilliseconds() !== 0) return millisecondFormatter.format(value)
    if (value.getUTCSeconds() !== 0) return secondFormatter.format(value)
    return minuteFormatter.format(value)
  }
  const axisNumber = (value: number) => axisNumberFormatter.format(value)
  const number = (value: number) => numberFormatter.format(value)
  const value = (input: ChartValue) => input instanceof Date ? date(input) : typeof input === 'number' ? number(input) : input
  return { date, axisNumber, number, value }
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
