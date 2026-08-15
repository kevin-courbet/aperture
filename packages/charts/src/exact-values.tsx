import { useId, useState, type ReactNode } from 'react'
import { useChartFormatters } from './formatting.js'
import { useChartConfiguration } from './provider.js'
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

export interface SemanticLegendItem {
  readonly label: string
  readonly kind?: 'series' | 'reference' | 'missing'
  readonly detail?: string
  readonly symbol?:
    | { readonly kind: 'swatch'; readonly seriesIndex: number }
    | { readonly kind: 'line'; readonly seriesIndex: number; readonly dasharray: string }
    | { readonly kind: 'point'; readonly seriesIndex: number; readonly radius: number; readonly hollow: boolean }
    | { readonly kind: 'missing' }
}

export const lineSeriesDasharrays = ['', '8 3', '2 3', '10 3 2 3', '1 3'] as const
export const pointSeriesStyles = [
  { radius: 4.5, hollow: false },
  { radius: 4.5, hollow: true },
  { radius: 3.25, hollow: false },
  { radius: 6, hollow: true },
  { radius: 6, hollow: false },
] as const
type SeriesLegendSymbolKind = 'swatch' | 'line' | 'point' | 'missing'

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

export function seriesLegend(
  series: readonly string[],
  symbolKind: SeriesLegendSymbolKind | ((label: string) => SeriesLegendSymbolKind) = 'swatch',
): readonly SemanticLegendItem[] {
  const unique = [...new Set(series)]
  if (unique.length > 5) {
    throw new RangeError('Series charts support at most 5 series.')
  }
  return unique.map((label, seriesIndex) => {
    const kind = typeof symbolKind === 'function' ? symbolKind(label) : symbolKind
    return {
      label,
      symbol: kind === 'line'
        ? { kind: 'line', seriesIndex, dasharray: lineSeriesDasharrays[seriesIndex] ?? '' }
        : kind === 'point'
          ? { kind: 'point', seriesIndex, ...(pointSeriesStyles[seriesIndex] ?? pointSeriesStyles[0]) }
          : kind === 'missing'
            ? { kind: 'missing' }
            : { kind: 'swatch', seriesIndex },
    }
  })
}

function ExactValueTable({ model }: { readonly model: ExactValueModel }) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()

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

export function ExactValues({
  model,
}: {
  readonly model: ExactValueModel
}) {
  const { messages } = useChartConfiguration()
  const widget = useOptionalChartWidget()
  const [visible, setVisible] = useState(false)
  const localId = useId()
  const id = widget?.tableId ?? localId
  const tableVisible = widget?.tableVisible ?? visible

  if (widget !== null) {
    if (!widget.tableAvailable) throw new Error('A ready chart requires ChartWidget.Root exactValues="available".')
    return (
      <section className="aperture-exact-values" aria-label={model.caption ?? messages.table.caption}>
        <div id={id} className={tableVisible ? 'aperture-table-scroll' : 'aperture-visually-hidden'}>
          <ExactValueTable model={model} />
        </div>
      </section>
    )
  }
  return (
    <section className="aperture-exact-values">
      <button
        type="button"
        className="aperture-exact-toggle"
        aria-pressed={tableVisible}
        aria-controls={id}
        onClick={() => setVisible((current) => !current)}
      >
        {tableVisible ? messages.controls.hideTable : messages.controls.showTable}
      </button>
      <div id={id} className={tableVisible ? 'aperture-table-scroll' : 'aperture-visually-hidden'}>
        <ExactValueTable model={model} />
      </div>
    </section>
  )
}

export function SemanticLegend({ items }: { readonly items: readonly SemanticLegendItem[] }) {
  if (items.length === 0) return null
  return (
    <ul className="aperture-legend" aria-label="Chart legend">
      {items.map((item, index) => (
        <li key={`${item.kind ?? 'series'}-${item.label}`}>
          {item.kind === 'reference' ? (
            <svg className="aperture-legend-reference" viewBox="0 0 24 8" aria-hidden="true">
              <line x1="1" x2="23" y1="4" y2="4" />
            </svg>
          ) : item.symbol?.kind === 'line' ? (
            <svg
              className="aperture-legend-line"
              data-series={item.symbol.seriesIndex}
              viewBox="0 0 24 8"
              aria-hidden="true"
            >
              <line x1="1" x2="23" y1="4" y2="4" strokeDasharray={item.symbol.dasharray || undefined} />
            </svg>
          ) : item.symbol?.kind === 'point' ? (
            <svg
              className="aperture-legend-point"
              data-series={item.symbol.seriesIndex}
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r={item.symbol.radius} data-hollow={item.symbol.hollow || undefined} />
            </svg>
          ) : (
            <span
              className="aperture-legend-swatch"
              data-kind={item.symbol?.kind === 'missing' ? 'missing' : item.kind ?? 'series'}
              data-series={(item.kind === undefined || item.kind === 'series') && item.symbol?.kind !== 'missing'
                ? item.symbol?.seriesIndex ?? index % 5
                : undefined}
              data-symbol={(item.kind === undefined || item.kind === 'series') && item.symbol?.kind !== 'missing'
                ? index % 5
                : undefined}
              aria-hidden="true"
            />
          )}
          <span>{item.label}{item.detail === undefined ? null : `: ${item.detail}`}</span>
        </li>
      ))}
    </ul>
  )
}
