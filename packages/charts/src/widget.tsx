import {
  createContext,
  use,
  useState,
  type ReactNode,
} from 'react'
import type {
  ChartSlot,
  ChartSlotClassNames,
  ChartWidgetSlotProps,
} from './types.js'

interface WidgetContextValue {
  readonly tableVisible: boolean
  readonly setTableVisible: (visible: boolean) => void
  readonly slotClassNames: ChartSlotClassNames
}

const WidgetContext = createContext<WidgetContextValue | null>(null)

export function useChartWidget(): WidgetContextValue {
  const context = use(WidgetContext)
  if (!context) throw new Error('ChartWidget slots must be inside ChartWidget.Root.')
  return context
}

export interface ChartWidgetRootProps extends ChartWidgetSlotProps {
  readonly slotClassNames?: ChartSlotClassNames
  readonly tableVisible?: boolean
  readonly defaultTableVisible?: boolean
  readonly onTableVisibleChange?: (visible: boolean) => void
}

function slotClass(
  slot: ChartSlot,
  className: string | undefined,
  configured: ChartSlotClassNames,
): string {
  return ['aperture-slot', `aperture-${slot}`, configured[slot], className]
    .filter(Boolean)
    .join(' ')
}

function Root({
  children,
  className,
  style,
  slotClassNames = {},
  tableVisible,
  defaultTableVisible = false,
  onTableVisibleChange,
}: ChartWidgetRootProps) {
  const [uncontrolledVisible, setUncontrolledVisible] = useState(defaultTableVisible)
  const visible = tableVisible ?? uncontrolledVisible

  function setVisible(next: boolean) {
    if (tableVisible === undefined) setUncontrolledVisible(next)
    onTableVisibleChange?.(next)
  }

  return (
    <WidgetContext
      value={{ tableVisible: visible, setTableVisible: setVisible, slotClassNames }}
    >
      <section
        data-aperture-root=""
        data-aperture-slot="root"
        className={slotClass('root', className, slotClassNames)}
        style={style}
      >
        {children}
      </section>
    </WidgetContext>
  )
}

function Slot({
  slot,
  element,
  children,
  className,
  style,
}: ChartWidgetSlotProps & {
  readonly slot: Exclude<ChartSlot, 'root' | 'table'>
  readonly element: 'header' | 'div' | 'footer'
}) {
  const context = useChartWidget()
  const props = {
    'data-aperture-slot': slot,
    className: slotClass(slot, className, context.slotClassNames),
    style,
    children,
  }
  if (element === 'header') return <header {...props} />
  if (element === 'footer') return <footer {...props} />
  return <div {...props} />
}

function Header(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="header" element="header" />
}

function Controls(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="controls" element="div" />
}

function Plot(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="plot" element="div" />
}

function Footer(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="footer" element="footer" />
}

function TableRegion({ children, className, style }: ChartWidgetSlotProps) {
  const context = useChartWidget()
  if (!context.tableVisible) return null
  return (
    <div
      data-aperture-slot="table"
      className={slotClass('table', className, context.slotClassNames)}
      style={style}
    >
      {children}
    </div>
  )
}

export const ChartWidget = { Root, Header, Controls, Plot, TableRegion, Footer }

export interface ExactValueColumn<TDatum> {
  readonly id: string
  readonly header: ReactNode
  readonly value: (datum: TDatum) => ReactNode
  readonly rowHeader?: boolean
}

export interface ExactValueTableProps<TDatum> {
  readonly data: readonly TDatum[]
  readonly columns: readonly [ExactValueColumn<TDatum>, ...ExactValueColumn<TDatum>[]]
  readonly rowKey: (datum: TDatum, index: number) => string
  readonly caption?: ReactNode
  readonly className?: string
}

export function ExactValueTable<TDatum>({
  data,
  columns,
  rowKey,
  caption,
  className,
}: ExactValueTableProps<TDatum>) {
  return (
    <div data-aperture-root="" className="aperture-table-scroll">
      <table className={['aperture-table', className].filter(Boolean).join(' ')}>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => <th key={column.id} scope="col">{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((datum, rowIndex) => (
            <tr key={rowKey(datum, rowIndex)}>
              {columns.map((column) =>
                column.rowHeader ? (
                  <th key={column.id} scope="row">{column.value(datum)}</th>
                ) : (
                  <td key={column.id}>{column.value(datum)}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
