import { defineChart, dot, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { Chart as SvgChart } from '@tanstack/charts/react/tooltip'
import { scaleUtc } from 'd3-scale'
import { useId, type ReactNode } from 'react'
import { contextPaint, prepareTimeHighlights, timeHighlightBackground } from './annotations.js'
import { exactRow, exactValues, HiddenExactValues } from './exact-values.js'
import { preciseDifference, useChartFormatters, useDayFormatter } from './formatting.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, SingletonChartStateBoundary } from './surface.js'
import type { ChartDataState, ChartFormatters, NumericPoint, SingletonChartDataState, TimeHighlight } from './types.js'
import { finite, numericPoint, positiveHeight, positiveWidth, validDate } from './validation.js'

export interface SparklineDatum {
  readonly id: string
  readonly date: Date
  readonly value: NumericPoint
}

export interface SparklineProps {
  readonly state: ChartDataState<SparklineDatum>
  /** Names the measure. Aperture adds the first, last, lowest, and highest values to the description. */
  readonly ariaLabel: string
  /** Pixel height. Defaults to 36. */
  readonly height?: number
  /** Expected server width in pixels. Defaults to 200. The rendered sparkline fills its container. */
  readonly initialWidth?: number
  /** Points on or after this date use the accent color. Earlier points use the context color. */
  readonly accentFrom?: Date
  /** Shaded ranges and event rules without labels. The description names them. */
  readonly highlights?: readonly TimeHighlight[]
  readonly formatters?: ChartFormatters
}

interface SparklineRow {
  readonly id: string
  readonly date: Date
  readonly value: number | null
}

const accentPaint = 'var(--aperture-chart-1)'

function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}

/**
 * A word-sized line chart without axes, legend, or controls. Use it beside a
 * number that it explains, such as in a StatTile. The description and a hidden
 * exact-value table carry the values for screen readers.
 */
export function Sparkline({ state, ariaLabel, height = 36, initialWidth = 200, accentFrom, highlights, formatters: overrides }: SparklineProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(overrides)
  const formatDay = useDayFormatter()
  positiveHeight(height, messages.errors.invalidHeight)
  positiveWidth(initialWidth, messages.errors.invalidWidth)
  if (accentFrom !== undefined) validDate(accentFrom, messages.errors.invalidDate)
  return (
    <ChartStateBoundary state={state} rootProps={{ ariaLabel, ariaDescription: ariaLabel, height, initialWidth, className: 'aperture-sparkline-state' }}>
      {(data) => {
        const rows: SparklineRow[] = data
          .map((datum) => ({ id: datum.id, date: validDate(datum.date, messages.errors.invalidDate), value: numericPoint(datum.value, messages.errors.invalidNumber) }))
          .sort((left, right) => left.date.getTime() - right.date.getTime())
        const present = rows.filter((row): row is SparklineRow & { value: number } => row.value !== null)
        const first = present[0]
        const last = present[present.length - 1]
        if (first === undefined || last === undefined) {
          throw new RangeError('Sparkline requires at least one value that is not missing.')
        }
        const values = present.map((row) => row.value)
        const minimum = Math.min(...values)
        const maximum = Math.max(...values)
        const pad = minimum === maximum ? 1 : (maximum - minimum) * 0.08
        const yDomain: readonly [number, number] = [minimum - pad, maximum + pad]
        const dates = rows.map((row) => row.date)
        const start = dates[0]!
        const end = dates[dates.length - 1]!
        const xDomain: readonly [Date, Date] = start.getTime() === end.getTime()
          ? [new Date(start.getTime() - 43_200_000), new Date(end.getTime() + 43_200_000)]
          : [start, end]
        const prepared = prepareTimeHighlights(highlights, dates, messages, formatDay)
        // The accent segment starts at the last point before accentFrom so the line stays connected.
        const accentIndex = accentFrom === undefined ? 0 : rows.findIndex((row) => row.date.getTime() >= accentFrom.getTime())
        const accentRows = accentIndex === -1 ? [] : rows.slice(Math.max(0, accentIndex - 1))
        const definition = defineChart({
          pointer: false,
          keyboard: false,
          tooltip: false,
          margin: { top: 4, right: 5, bottom: 4, left: 2 },
          marks: [
            ...timeHighlightBackground(prepared, yDomain),
            ...(accentFrom === undefined ? [] : [lineY(rows, { id: 'aperture-sparkline-context', x: 'date', y: 'value', key: 'id', stroke: contextPaint, strokeWidth: 1.5 })]),
            ...(accentRows.length > 1 ? [lineY(accentRows, { id: 'aperture-sparkline-accent', x: 'date', y: 'value', key: 'id', stroke: accentPaint, strokeWidth: 1.75 })] : []),
            dot([last], { id: 'aperture-sparkline-end', x: 'date', y: 'value', key: 'id', r: 3, fill: last.date.getTime() >= (accentFrom?.getTime() ?? Number.NEGATIVE_INFINITY) ? accentPaint : contextPaint, stroke: 'var(--aperture-color-background)', strokeWidth: 1.5 }),
          ],
          scales: {
            x: { scale: scaleUtc().domain(xDomain), axis: false },
            y: { scale: scaleLinear().domain(yDomain), axis: false },
          },
        })
        const summary = fillTemplate(messages.sparkline.summary, {
          first: formatters.number(first.value),
          firstDate: formatDay(first.date),
          last: formatters.number(last.value),
          lastDate: formatDay(last.date),
          minimum: formatters.number(minimum),
          maximum: formatters.number(maximum),
        })
        return (
          <div data-aperture-root="" className="aperture-sparkline">
            <div className="aperture-sparkline-canvas" style={{ height }}>
              <SvgChart
                definition={definition}
                ariaLabel={ariaLabel}
                ariaDescription={[summary, prepared.description].filter(Boolean).join(' ')}
                height={height}
                initialWidth={initialWidth}
              />
            </div>
            <HiddenExactValues
              formatters={overrides}
              model={exactValues(['Date', ariaLabel], data.map((datum) => exactRow(datum.id, datum.date, datum.value)), ariaLabel)}
            />
          </div>
        )
      }}
    </ChartStateBoundary>
  )
}

export interface StatTileDatum {
  readonly value: number
  /** The earlier value that the delta compares against. */
  readonly comparison?: {
    readonly value: number
    /** Names the earlier period, such as "vs 17 Aug – 7 Sep". */
    readonly label: string
  }
}

export interface StatTileProps {
  /** Names the measure and its period, such as "Checkout conversion · 8–21 Sep". */
  readonly label: string
  readonly state: SingletonChartDataState<StatTileDatum>
  /** Formats the headline value without its unit. */
  readonly format: (value: number) => string
  /** Unit shown after the value at a smaller size, such as "%". */
  readonly unit?: string
  /** Which delta direction is good. Required when the datum has a comparison. */
  readonly goodDirection?: 'increase' | 'decrease' | 'neither'
  /** Formats the absolute delta, such as "3.2 pp". The tile adds the sign and arrow. */
  readonly formatDelta?: (delta: number) => string
  /** One muted line under the delta, such as a later value or a definition. */
  readonly note?: ReactNode
  /** A Sparkline or other small trend for the same measure. */
  readonly trend?: ReactNode
  readonly className?: string
}

/**
 * One headline number with its change from an earlier period. The arrow,
 * sign, and screen-reader text carry the direction, so color is not the only
 * signal. Color shows whether the change is good.
 */
export function StatTile({ label, state, format, unit, goodDirection, formatDelta, note, trend, className }: StatTileProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  const labelId = useId()
  return (
    <SingletonChartStateBoundary state={state} rootProps={{ ariaLabel: label, ariaDescription: label, height: 96, className: ['aperture-stat-state', className].filter(Boolean).join(' ') }}>
      {(datum) => {
        const value = finite(datum.value, messages.errors.invalidNumber)
        const comparison = datum.comparison
        if (comparison !== undefined) {
          finite(comparison.value, messages.errors.invalidNumber)
          if (goodDirection === undefined) throw new RangeError('StatTile requires goodDirection when the datum has a comparison.')
        }
        const delta = comparison === undefined ? null : preciseDifference(value, comparison.value)
        const direction = delta === null ? null : delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'none'
        const tone = direction === null || direction === 'none' || goodDirection === 'neither'
          ? 'neutral'
          : direction === goodDirection ? 'good' : 'bad'
        const deltaText = delta === null ? '' : (formatDelta ?? formatters.number)(Math.abs(delta))
        const directionText = direction === 'increase' ? messages.stat.increase : direction === 'decrease' ? messages.stat.decrease : messages.stat.noChange
        return (
          <section data-aperture-root="" className={['aperture-stat-tile', className].filter(Boolean).join(' ')} aria-labelledby={labelId}>
            <p id={labelId} className="aperture-stat-label">{label}</p>
            <p className="aperture-stat-value">
              {format(value)}{unit === undefined ? null : <span className="aperture-stat-unit">{unit}</span>}
            </p>
            {comparison === undefined || delta === null
              ? null
              : (
                <p className="aperture-stat-delta">
                  <span className="aperture-stat-change" data-tone={tone}>
                    <span aria-hidden="true">{direction === 'increase' ? '▲ +' : direction === 'decrease' ? '▼ −' : '■ '}</span>
                    <span className="aperture-visually-hidden">{`${directionText} of `}</span>
                    {deltaText}
                    {tone === 'neutral' ? null : <span className="aperture-visually-hidden">{`, ${tone === 'good' ? messages.stat.better : messages.stat.worse},`}</span>}
                  </span>
                  {' '}{comparison.label}
                </p>
              )}
            {trend === undefined ? null : <div className="aperture-stat-trend">{trend}</div>}
            {note === undefined ? null : <p className="aperture-stat-note">{note}</p>}
          </section>
        )
      }}
    </SingletonChartStateBoundary>
  )
}
