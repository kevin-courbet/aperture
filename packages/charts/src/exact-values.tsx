import { type ReactNode } from 'react'
import { useChartFormatters, type ChartFormatters } from './formatting.js'
import { useChartConfiguration } from './provider.js'
import { chartColors } from './palette.js'
import type { NumericPoint } from './types.js'
import { useOptionalChartWidget } from './widget.js'

export type ExactValue = string | number | Date | null | NumericPoint

export interface ExactValueColumn {
  readonly id: string
  readonly label: string
  readonly rowHeader?: boolean
}

export interface ExactValueRow {
  readonly key: string
  readonly values: readonly ExactValue[]
}

export interface ExactValueModel {
  readonly caption?: string
  readonly columns: readonly [ExactValueColumn, ...ExactValueColumn[]]
  readonly rows: readonly ExactValueRow[]
}

/** Legend symbols mirror the mark they describe. Paint values are CSS colors. */
export type LegendSymbol =
  | { readonly kind: 'swatch'; readonly paint: string }
  | { readonly kind: 'line'; readonly paint: string; readonly dasharray: string }
  | { readonly kind: 'point'; readonly paint: string; readonly radius: number; readonly hollow: boolean }
  | { readonly kind: 'reference' }
  | { readonly kind: 'missing' }
  | { readonly kind: 'band' }
  | { readonly kind: 'event' }
  | { readonly kind: 'outline' }
  | { readonly kind: 'ramp'; readonly stops: readonly [string, string, ...string[]]; readonly ticks: readonly [string, string, ...string[]] }

export interface SemanticLegendItem {
  readonly label: string
  readonly detail?: string
  readonly symbol: LegendSymbol
}

export const lineSeriesDasharrays = [
  '',
  '8 3',
  '2 3',
  '10 3 2 3',
  '1 3',
  '12 4',
  '4 2 1 2',
  '2 2 8 2',
] as const
export const pointSeriesStyles = [
  { radius: 4.5, hollow: false },
  { radius: 4.5, hollow: true },
  { radius: 3.25, hollow: false },
  { radius: 6, hollow: true },
  { radius: 6, hollow: false },
  { radius: 3.25, hollow: true },
  { radius: 5.25, hollow: false },
  { radius: 5.25, hollow: true },
] as const

export function seriesPaint(index: number): string {
  const paint = chartColors[index]
  if (paint === undefined) throw new RangeError('Series charts support at most 8 series.')
  return paint
}

export type SeriesLegendSymbol = (index: number, label: string) => LegendSymbol

export const swatchSymbol: SeriesLegendSymbol = (index) => ({ kind: 'swatch', paint: seriesPaint(index) })
export const lineSymbol: SeriesLegendSymbol = (index) => ({ kind: 'line', paint: seriesPaint(index), dasharray: lineSeriesDasharrays[index] ?? '' })
export const solidLineSymbol: SeriesLegendSymbol = (index) => ({ kind: 'line', paint: seriesPaint(index), dasharray: '' })
export const pointSymbol: SeriesLegendSymbol = (index) => ({ kind: 'point', paint: seriesPaint(index), ...(pointSeriesStyles[index] ?? pointSeriesStyles[0]) })

export function dotSymbol(radius: number): SeriesLegendSymbol {
  return (index) => ({ kind: 'point', paint: seriesPaint(index), radius, hollow: false })
}

export function exactValues(
  columns: readonly [string, ...string[]],
  rows: readonly ExactValueRow[],
  caption?: string,
): ExactValueModel {
  const [first, ...rest] = columns
  return {
    caption,
    columns: [
      { id: `0-${first}`, label: first, rowHeader: true },
      ...rest.map((label, index) => ({ id: `${index + 1}-${label}`, label })),
    ],
    rows,
  }
}

export function exactRow(key: string, ...values: readonly ExactValue[]): ExactValueRow {
  return { key, values }
}

/**
 * One legend entry per distinct series, in first-appearance order. A single
 * series returns no entries because the chart title already names it.
 */
export function seriesLegend(
  series: readonly string[],
  symbol: SeriesLegendSymbol = swatchSymbol,
): readonly SemanticLegendItem[] {
  const unique = [...new Set(series)]
  if (unique.length > 8) {
    throw new RangeError('Series charts support at most 8 series.')
  }
  if (unique.length === 1) return []
  return unique.map((label, index) => ({ label, symbol: symbol(index, label) }))
}

function ExactValueTable({
  model,
  formatters,
}: {
  readonly model: ExactValueModel
  readonly formatters: ChartFormatters
}) {
  const { messages } = useChartConfiguration()

  function format(value: ExactValue): ReactNode {
    if (value === null) return 'Not applicable'
    if (value instanceof Date) return formatters.date(value)
    if (typeof value === 'number') return formatters.number(value)
    if (typeof value === 'string') return value
    return value.kind === 'missing' ? `Missing: ${value.reason}` : formatters.number(value.value)
  }

  return (
    <table className="aperture-table">
      <caption>{model.caption ?? messages.table.caption}</caption>
      <thead><tr>{model.columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}</tr></thead>
      <tbody>
        {model.rows.map((row) => {
          if (row.values.length !== model.columns.length) {
            throw new RangeError('Exact-value rows must have one value for each column.')
          }
          return (
            <tr key={row.key}>
              {row.values.map((value, index) => model.columns[index]?.rowHeader
                ? <th key={model.columns[index].id} scope="row">{format(value)}</th>
                : <td key={model.columns[index]?.id}>{format(value)}</td>)}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Exact values for a chart that has no widget table, such as a sparkline. Screen readers read it. It is not visible. */
export function HiddenExactValues({
  model,
  formatters: formatterOverrides,
}: {
  readonly model: ExactValueModel
  readonly formatters?: import('./types.js').ChartFormatters
}) {
  const formatters = useChartFormatters(formatterOverrides)
  return (
    <div className="aperture-visually-hidden">
      <ExactValueTable model={model} formatters={formatters} />
    </div>
  )
}

export function ExactValues({
  model,
  formatters: formatterOverrides,
}: {
  readonly model: ExactValueModel
  readonly formatters?: import('./types.js').ChartFormatters
}) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(formatterOverrides)
  const widget = useOptionalChartWidget()
  if (widget !== null) {
    if (!widget.tableAvailable) throw new Error('A ready chart requires ChartWidget.Root exactValues="available".')
    return (
      <section className="aperture-exact-values" aria-label={model.caption ?? messages.table.caption}>
        <div
          id={widget.tableId}
          className={widget.tableVisible ? 'aperture-table-scroll' : 'aperture-visually-hidden'}
          role={widget.tableVisible ? 'region' : undefined}
          aria-label={widget.tableVisible ? model.caption ?? messages.table.caption : undefined}
          tabIndex={widget.tableVisible ? 0 : undefined}
        >
          <ExactValueTable model={model} formatters={formatters} />
        </div>
      </section>
    )
  }
  throw new Error('Exact values require a chart widget context.')
}

function LegendGlyph({ symbol }: { readonly symbol: LegendSymbol }) {
  switch (symbol.kind) {
    case 'swatch':
      return <span className="aperture-legend-swatch" style={{ color: symbol.paint }} aria-hidden="true" />
    case 'line':
      return (
        <svg className="aperture-legend-line" style={{ color: symbol.paint }} viewBox="0 0 24 8" aria-hidden="true">
          <line x1="1" x2="23" y1="4" y2="4" strokeDasharray={symbol.dasharray || undefined} />
        </svg>
      )
    case 'point':
      return (
        <svg className="aperture-legend-point" style={{ color: symbol.paint }} viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="7" cy="7" r={symbol.radius} data-hollow={symbol.hollow || undefined} />
        </svg>
      )
    case 'reference':
      return (
        <svg className="aperture-legend-reference" viewBox="0 0 24 8" aria-hidden="true">
          <line x1="1" x2="23" y1="4" y2="4" />
        </svg>
      )
    case 'missing':
      return <span className="aperture-legend-missing" aria-hidden="true" />
    case 'band':
      return <span className="aperture-legend-band" aria-hidden="true" />
    case 'event':
      return (
        <svg className="aperture-legend-event" viewBox="0 0 8 14" aria-hidden="true">
          <line x1="4" x2="4" y1="1" y2="13" />
        </svg>
      )
    case 'outline':
      return <span className="aperture-legend-outline" aria-hidden="true" />
    case 'ramp':
      return (
        <span className="aperture-legend-ramp" aria-hidden="true">
          <span className="aperture-legend-ramp-bar" style={{ background: `linear-gradient(to right, ${symbol.stops.join(', ')})` }} />
          <span className="aperture-legend-ramp-ticks">
            {symbol.ticks.map((tick, index) => <span key={`${index}-${tick}`}>{tick}</span>)}
          </span>
        </span>
      )
  }
}

export function SemanticLegend({ items }: { readonly items: readonly SemanticLegendItem[] }) {
  if (items.length === 0) return null
  return (
    <ul className="aperture-legend" aria-label="Chart legend">
      {items.map((item) => (
        <li key={`${item.symbol.kind}-${item.label}`} data-symbol={item.symbol.kind}>
          <LegendGlyph symbol={item.symbol} />
          <span>{item.label}{item.detail === undefined ? null : `: ${item.detail}`}</span>
          {item.symbol.kind === 'ramp'
            ? <span className="aperture-visually-hidden">{`, from ${item.symbol.ticks[0]} to ${item.symbol.ticks[item.symbol.ticks.length - 1]}`}</span>
            : null}
        </li>
      ))}
    </ul>
  )
}
