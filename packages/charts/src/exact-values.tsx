import { useId, useState, type ReactNode } from 'react'
import { useChartFormatters } from './formatting'
import { useChartConfiguration } from './provider'
import type { AccessibleExactValueReplacement, NumericPoint } from './types'

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

export function seriesLegend(series: readonly string[]): readonly SemanticLegendItem[] {
  const unique = [...new Set(series)]
  if (unique.length > 5) {
    throw new RangeError('Series charts support at most 5 series.')
  }
  return unique.map((label) => ({ label }))
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
  replacement,
}: {
  readonly model: ExactValueModel
  readonly replacement?: AccessibleExactValueReplacement
}) {
  const { messages } = useChartConfiguration()
  const [visible, setVisible] = useState(false)
  const id = useId()
  if (replacement) {
    return <section aria-label={replacement.description}>{replacement.content}</section>
  }
  return (
    <section className="aperture-exact-values">
      <button
        type="button"
        className="aperture-exact-toggle"
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? messages.controls.hideTable : messages.controls.showTable}
      </button>
      <div id={id} className={visible ? 'aperture-table-scroll' : 'aperture-visually-hidden'}>
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
          <span className="aperture-legend-swatch" data-kind={item.kind ?? 'series'} data-symbol={index % 5} aria-hidden="true" />
          <span>{item.label}{item.detail === undefined ? null : `: ${item.detail}`}</span>
        </li>
      ))}
    </ul>
  )
}
