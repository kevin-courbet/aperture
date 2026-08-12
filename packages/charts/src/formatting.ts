import type { ChartTooltipInput, ChartValue } from '@tanstack/charts'
import { tooltip as tooltipExtension } from '@tanstack/charts/tooltip'
import { useChartConfiguration } from './provider'

export interface ChartFormatters {
  readonly date: (value: Date) => string
  readonly number: (value: number) => string
  readonly value: (value: ChartValue) => string
}

export function useChartFormatters(): ChartFormatters {
  const { locale, timeZone } = useChartConfiguration()
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  })
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 })
  const date = (value: Date) => dateFormatter.format(value)
  const number = (value: number) => numberFormatter.format(value)
  const value = (input: ChartValue) => input instanceof Date ? date(input) : typeof input === 'number' ? number(input) : input
  return { date, number, value }
}

export function dateAxis(label: string | undefined, formatters: ChartFormatters) {
  return { ticks: { format: formatters.date }, ...(label === undefined ? {} : { label }) }
}

export function numberAxis(label: string | undefined, formatters: ChartFormatters) {
  return { ticks: { format: formatters.number }, ...(label === undefined ? {} : { label }) }
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
