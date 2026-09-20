import type { ChartTooltipInput, ChartValue } from '@tanstack/charts'
import { tooltip as tooltipExtension } from '@tanstack/charts/tooltip'
import { useChartConfiguration } from './provider.js'
import type { ChartFormatters as ChartFormatterOverrides, GroupedChartTooltipOptions } from './types.js'

export interface ChartFormatters {
  readonly date: (value: Date) => string
  readonly axisNumber: (value: number) => string
  readonly number: (value: number) => string
  readonly percentage: (value: number) => string
  readonly value: (value: ChartValue) => string
}

export function useChartFormatters(overrides?: ChartFormatterOverrides): ChartFormatters {
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
  const percentageFormatter = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const defaultDate = (value: Date) => {
    if (value.getUTCMilliseconds() !== 0) return millisecondFormatter.format(value)
    if (value.getUTCSeconds() !== 0) return secondFormatter.format(value)
    return minuteFormatter.format(value)
  }
  const date = overrides?.date ?? defaultDate
  const axisNumber = overrides?.axisNumber ?? ((value: number) => axisNumberFormatter.format(value))
  const number = overrides?.number ?? ((value: number) => numberFormatter.format(value))
  const percentage = overrides?.percentage ?? ((value: number) => percentageFormatter.format(value))
  const value = (input: ChartValue) => input instanceof Date ? date(input) : typeof input === 'number' ? number(input) : input
  return { date, axisNumber, number, percentage, value }
}

export function numberAxis(label: string | undefined, formatters: ChartFormatters) {
  return { ticks: { format: formatters.axisNumber }, ...(label === undefined ? {} : { label }) }
}

export function localizedTooltip(
  tooltip: boolean | GroupedChartTooltipOptions | undefined,
  formatters: ChartFormatters,
  readout?: string,
  grouped = false,
): ChartTooltipInput<any, any, any, 'dom'> | undefined {
  if (tooltip === false) return undefined
  return {
    use: tooltipExtension,
    format: (point) => readout ?? `${formatters.value(point.xValue)}: ${formatters.value(point.yValue)}`,
    ...(grouped
      ? {
          formatGroup: (points) => {
            const first = points[0]
            if (first === undefined) return ''
            const total = typeof tooltip === 'object' ? tooltip.groupedTotal?.(points) : undefined
            return [
              formatters.value(first.xValue),
              ...points.map((point) => `${point.groupLabel}: ${formatters.value(point.yValue)}`),
              ...(total === undefined ? [] : [`${total.label}: ${total.value}`]),
            ].join('\n')
          },
        }
      : {}),
  }
}

export function localizedHorizontalTooltip(
  tooltip: boolean | GroupedChartTooltipOptions | undefined,
  formatters: ChartFormatters,
  grouped = false,
): ChartTooltipInput<any, any, any, 'dom'> | undefined {
  if (tooltip === false) return undefined
  return {
    use: tooltipExtension,
    format: (point) => `${formatters.value(point.yValue)}: ${formatters.value(point.xValue)}`,
    ...(grouped
      ? {
          formatGroup: (points) => {
            const first = points[0]
            if (first === undefined) return ''
            const total = typeof tooltip === 'object' ? tooltip.groupedTotal?.(points) : undefined
            return [
              formatters.value(first.yValue),
              ...points.map((point) => `${point.groupLabel}: ${formatters.value(point.xValue)}`),
              ...(total === undefined ? [] : [`${total.label}: ${total.value}`]),
            ].join('\n')
          },
        }
      : {}),
  }
}
