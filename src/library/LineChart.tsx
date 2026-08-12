import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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
  height?: number
}

function formatValue(value: number, formatter: YFormatter, locale: string, invalidValueMessage: string) {
  if (!Number.isFinite(value)) throw new Error(invalidValueMessage)
  const options: Intl.NumberFormatOptions = { maximumFractionDigits: formatter.maximumFractionDigits ?? 1 }
  if (formatter.kind === 'percent') return new Intl.NumberFormat(locale, { ...options, style: 'percent' }).format(value)
  if (formatter.kind === 'currency') return new Intl.NumberFormat(locale, { ...options, style: 'currency', currency: formatter.currency }).format(value)
  return `${new Intl.NumberFormat(locale, options).format(value)}${formatter.unit ? ` ${formatter.unit}` : ''}`
}

export function LineChart<TDatum>({ state, x, y, xLabel, goal, formatter, ariaLabel, ariaDescription, seriesLabel, height = 300 }: Props<TDatum>) {
  const { locale, timeZone, messages } = useChartConfig()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [renderHeight, setRenderHeight] = useState(height)
  const [surface, setSurface] = useState<HTMLDivElement | null>(null)
  if (!Number.isFinite(height) || height <= 0) throw new Error('Chart height must be a positive finite number.')

  useEffect(() => {
    if (!surface) return
    const observer = new ResizeObserver(([entry]) => {
      const nextHeight = Math.max(1, Math.round(entry.contentRect.height))
      setRenderHeight((currentHeight) => currentHeight === nextHeight ? currentHeight : nextHeight)
    })
    observer.observe(surface)
    return () => observer.disconnect()
  }, [surface])

  const sizeStyle = { '--chart-height': `${height}px` } as CSSProperties
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
        axis: {
          ticks: {
            values: points.map((point) => point.date),
            format: (value) => points.find((point) => point.date.getTime() === value.getTime())?.label ?? value.toLocaleDateString(locale, { month: 'short', timeZone }),
          },
        },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: {
          ticks: {
            format: (value) => formatValue(value, formatter, locale, messages.errors.invalidValue),
          },
        },
      },
      focus: 'nearest-x',
      tooltip: {
        use: tooltip,
        format: (point) => `${point.datum.label}: ${formatValue(point.datum.value, formatter, locale, messages.errors.invalidValue)}`,
      },
    })
    return { kind: 'trend' as const, points, definition }
  }, [formatter, goal, locale, messages.errors.invalidDate, messages.errors.invalidValue, state, timeZone, x, xLabel, y])

  if (state.status === 'loading') return <div className="chart-message chart-sized" style={sizeStyle} role="status">{messages.states.loading}</div>
  if (state.status === 'empty') return <div className="chart-message chart-sized" style={sizeStyle}>{state.message ?? messages.states.empty}</div>
  if (state.status === 'error') return <div className="chart-message chart-message-error chart-sized" style={sizeStyle} role="alert">{state.error.message}</div>
  if (!model) return null

  const focused = model.points[Math.min(focusedIndex, model.points.length - 1)]
  const resolvedSeriesLabel = seriesLabel ?? messages.controls.series
  if (model.kind === 'single') {
    return <div className="single-view chart-sized" style={sizeStyle} role="img" aria-label={ariaLabel} aria-description={ariaDescription}><p className="single-kicker">{messages.states.singleObservation}</p><div className="single-marker"><span className="marker-dot" aria-hidden="true" /><span>{formatValue(focused.value, formatter, locale, messages.errors.invalidValue)}</span></div>{goal ? <div className="single-target"><span className="target-dash" aria-hidden="true" />{goal.label}&nbsp;: {formatValue(goal.value, formatter, locale, messages.errors.invalidValue)}</div> : null}<p>{focused.label}</p><small>{messages.states.trendRequiresTwo}</small></div>
  }

  return <div className="chart-renderer chart-sized" style={sizeStyle}>{goal ? <div className="chart-goal-label"><span className="target-dash" aria-hidden="true" />{goal.label}: {formatValue(goal.value, formatter, locale, messages.errors.invalidValue)}</div> : null}<div ref={setSurface} className="chart-surface"><Chart definition={model.definition} ariaLabel={ariaLabel} ariaDescription={ariaDescription} height={renderHeight} onFocusChange={(point) => { if (point && 'index' in point.datum) setFocusedIndex(point.datum.index) }} /></div><div className="chart-readout" aria-live="polite"><span>{focused.label}</span><strong>{formatValue(focused.value, formatter, locale, messages.errors.invalidValue)}</strong><span>{resolvedSeriesLabel}</span></div></div>
}

export function ExactValueTable<TDatum>({ state, x, y, xLabel, goal, formatter, caption }: { state: ChartDataState<TDatum>; x: (datum: TDatum) => Date; y: (datum: TDatum) => number; xLabel?: (datum: TDatum) => string; goal?: ChartGoal; formatter: YFormatter; caption: string }) {
  const { locale, timeZone, messages } = useChartConfig()
  if (state.status !== 'ready') return null
  return <table className="exact-table"><caption>{caption}</caption><thead><tr><th scope="col">{messages.dataTable.date}</th><th scope="col">{messages.dataTable.value}</th><th scope="col">{messages.dataTable.target}</th></tr></thead><tbody>{state.data.map((datum, index) => { const date = x(datum); const value = y(datum); return <tr key={index}><th scope="row">{xLabel?.(datum) ?? date.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone })}</th><td>{formatValue(value, formatter, locale, messages.errors.invalidValue)}</td><td>{goal ? formatValue(goal.value, formatter, locale, messages.errors.invalidValue) : '—'}</td></tr> })}</tbody></table>
}
