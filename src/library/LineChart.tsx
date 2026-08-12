import { useMemo, useState } from 'react'
import { Chart } from '@tanstack/charts/react'
import { defineChart, lineY, ruleY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { scaleUtc } from 'd3-scale'
import { useChartConfig } from './ChartProvider'
import type { ChartDataState, ChartGoal, YFormatter } from './types'

type Props<TDatum> = {
  state: ChartDataState<TDatum>
  x: (datum: TDatum) => Date
  y: (datum: TDatum) => number
  xLabel?: (datum: TDatum) => string
  goal?: ChartGoal
  formatter: YFormatter
  ariaLabel: string
  ariaDescription: string
  seriesLabel?: string
}

function formatValue(value: number, formatter: YFormatter, locale: string, invalidValueMessage: string) {
  if (!Number.isFinite(value)) throw new Error(invalidValueMessage)
  const options: Intl.NumberFormatOptions = { maximumFractionDigits: formatter.maximumFractionDigits ?? 1 }
  if (formatter.kind === 'percent') return new Intl.NumberFormat(locale, { ...options, style: 'percent' }).format(value)
  if (formatter.kind === 'currency') return new Intl.NumberFormat(locale, { ...options, style: 'currency', currency: formatter.currency }).format(value)
  return `${new Intl.NumberFormat(locale, options).format(value)}${formatter.unit ? ` ${formatter.unit}` : ''}`
}

export function LineChart<TDatum>({ state, x, y, xLabel, goal, formatter, ariaLabel, ariaDescription, seriesLabel = 'Série' }: Props<TDatum>) {
  const { locale, timeZone, messages } = useChartConfig()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const model = useMemo(() => {
    if (state.status !== 'ready') return null
    const points = state.data.map((datum, index) => {
      const date = x(datum)
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error(messages.errors.invalidDate)
      const value = y(datum)
      if (!Number.isFinite(value)) throw new Error(messages.errors.invalidValue)
      return {
        index,
        date,
        value,
        label: xLabel?.(datum) ?? date.toLocaleDateString(locale, { month: 'short', year: 'numeric', timeZone }),
      }
    })
    if (goal && !Number.isFinite(goal.value)) throw new Error(messages.errors.invalidValue)
    if (points.length < 2) return { kind: 'single' as const, points }

    // TanStack uses complete definition identity as the update boundary.
    const definition = defineChart({
      marks: [
        lineY(points, { x: 'date', y: 'value', points: true, stroke: 'var(--chart-line)', strokeWidth: 2.5 }),
        ...(goal ? [ruleY([goal.value], { stroke: 'var(--chart-target)', strokeWidth: 1.5, strokeDasharray: '6 5' })] : []),
      ],
      x: {
        scale: scaleUtc,
        axis: { ticks: { format: (value) => value.toLocaleDateString(locale, { month: 'short', timeZone }) } },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { ticks: { format: (value) => formatValue(value, formatter, locale, messages.errors.invalidValue) } },
      },
      focus: 'nearest-x',
      tooltip: {
        use: tooltip,
        format: (point) => `${point.datum.label}: ${formatValue(point.datum.value, formatter, locale, messages.errors.invalidValue)}`,
      },
    })
    return { kind: 'trend' as const, points, definition }
  }, [formatter, goal, locale, messages.errors.invalidDate, messages.errors.invalidValue, state, timeZone, x, xLabel, y])

  if (state.status === 'loading') return <div className="chart-message" role="status">{messages.states.loading}</div>
  if (state.status === 'empty') return <div className="chart-message">{state.message ?? messages.states.empty}</div>
  if (state.status === 'error') return <div className="chart-message chart-message-error" role="alert">{state.error.message}</div>
  if (!model) return null

  const focused = model.points[Math.min(focusedIndex, model.points.length - 1)]
  if (model.kind === 'single') {
    return <div className="single-view" role="img" aria-label={ariaLabel} aria-description={ariaDescription}><p className="single-kicker">{messages.states.singleObservation}</p><div className="single-marker"><span className="marker-dot" aria-hidden="true" /><span>{formatValue(focused.value, formatter, locale, messages.errors.invalidValue)}</span></div>{goal ? <div className="single-target"><span className="target-dash" aria-hidden="true" />{goal.label}&nbsp;: {formatValue(goal.value, formatter, locale, messages.errors.invalidValue)}</div> : null}<p>{focused.label}</p><small>{messages.states.trendRequiresTwo}</small></div>
  }

  return <div className="chart-renderer"><Chart definition={model.definition} ariaLabel={ariaLabel} ariaDescription={ariaDescription} aspectRatio={2.35} onFocusChange={(point) => { if (point && 'index' in point.datum) setFocusedIndex(point.datum.index) }} />{goal ? <div className="target-rule"><span className="target-dash" aria-hidden="true" />{goal.label}&nbsp;: {formatValue(goal.value, formatter, locale, messages.errors.invalidValue)}</div> : null}<div className="chart-readout" aria-live="polite"><span>{focused.label}</span><strong>{formatValue(focused.value, formatter, locale, messages.errors.invalidValue)}</strong><span>{seriesLabel}</span></div></div>
}

export function ExactValueTable<TDatum>({ state, x, y, xLabel, goal, formatter, caption }: { state: ChartDataState<TDatum>; x: (datum: TDatum) => Date; y: (datum: TDatum) => number; xLabel?: (datum: TDatum) => string; goal?: ChartGoal; formatter: YFormatter; caption: string }) {
  const { locale, timeZone, messages } = useChartConfig()
  if (state.status !== 'ready') return null
  return <table className="exact-table"><caption>{caption}</caption><thead><tr><th scope="col">{messages.dataTable.date}</th><th scope="col">{messages.dataTable.value}</th><th scope="col">{messages.dataTable.target}</th></tr></thead><tbody>{state.data.map((datum, index) => { const date = x(datum); const value = y(datum); return <tr key={index}><th scope="row">{xLabel?.(datum) ?? date.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone })}</th><td>{formatValue(value, formatter, locale, messages.errors.invalidValue)}</td><td>{goal ? formatValue(goal.value, formatter, locale, messages.errors.invalidValue) : '—'}</td></tr> })}</tbody></table>
}
