import {
  createContext,
  use,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject,
  type ReactNode,
} from 'react'
import type {
  ChartSlot,
  ChartSlotClassNames,
  ChartWidgetSlotProps,
} from './types.js'

interface InternalWidgetContextValue {
  readonly targetRef: RefObject<HTMLElement | null>
  readonly tableId: string
  readonly tableAvailable: boolean
  readonly tableVisible: boolean
  readonly setTableVisible: (visible: boolean) => void
  readonly slotClassNames: ChartSlotClassNames
}

export type ChartWidgetContextValue = InternalWidgetContextValue

const WidgetContext = createContext<InternalWidgetContextValue | null>(null)

function useInternalChartWidget(): InternalWidgetContextValue {
  const context = use(WidgetContext)
  if (!context) throw new Error('ChartWidget slots must be inside ChartWidget.Root.')
  return context
}

export function useChartWidget(): ChartWidgetContextValue {
  return useInternalChartWidget()
}

export function useOptionalChartWidget(): InternalWidgetContextValue | null {
  return use(WidgetContext)
}

interface ChartWidgetRootBaseProps extends ChartWidgetSlotProps {
  readonly ref?: Ref<HTMLElement>
  readonly ariaLabel?: string
  readonly slotClassNames?: ChartSlotClassNames
}

export type ChartWidgetRootProps = ChartWidgetRootBaseProps & ({
  readonly exactValues: 'available'
} & ({
  readonly tableVisible: boolean
  readonly defaultTableVisible?: never
  readonly onTableVisibleChange: (visible: boolean) => void
} | {
  readonly tableVisible?: never
  readonly defaultTableVisible?: boolean
  readonly onTableVisibleChange?: (visible: boolean) => void
}) | {
  readonly exactValues: 'unavailable'
  readonly tableVisible?: never
  readonly defaultTableVisible?: never
  readonly onTableVisibleChange?: never
})

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
  ref,
  ariaLabel,
  children,
  className,
  style,
  slotClassNames = {},
  exactValues,
  tableVisible,
  defaultTableVisible,
  onTableVisibleChange,
}: ChartWidgetRootProps) {
  if (exactValues !== 'available' && exactValues !== 'unavailable') {
    throw new RangeError('ChartWidget.Root exactValues must be "available" or "unavailable".')
  }
  if (exactValues === 'unavailable' && (tableVisible !== undefined || defaultTableVisible !== undefined || onTableVisibleChange !== undefined)) {
    throw new RangeError('ChartWidget.Root cannot configure table visibility when exact values are unavailable.')
  }
  if (tableVisible !== undefined && defaultTableVisible !== undefined) {
    throw new RangeError('ChartWidget.Root cannot use tableVisible with defaultTableVisible.')
  }
  if (onTableVisibleChange !== undefined && typeof onTableVisibleChange !== 'function') {
    throw new TypeError('ChartWidget.Root onTableVisibleChange must be a function.')
  }
  if (tableVisible !== undefined && typeof onTableVisibleChange !== 'function') {
    throw new RangeError('Controlled table visibility requires onTableVisibleChange.')
  }
  const tableId = useId()
  const targetRef = useRef<HTMLElement>(null)
  useImperativeHandle(ref, () => targetRef.current!, [])
  const [uncontrolledVisible, setUncontrolledVisible] = useState(defaultTableVisible ?? false)
  const visible = tableVisible ?? uncontrolledVisible

  function setVisible(next: boolean) {
    if (tableVisible === undefined) setUncontrolledVisible(next)
    onTableVisibleChange?.(next)
  }

  return (
    <WidgetContext
      value={{ targetRef, tableId, tableAvailable: exactValues === 'available', tableVisible: visible, setTableVisible: setVisible, slotClassNames }}
    >
      <section
        ref={targetRef}
        aria-label={ariaLabel}
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
  readonly slot: Exclude<ChartSlot, 'root'>
  readonly element: 'header' | 'div' | 'footer'
}) {
  const context = useInternalChartWidget()
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

function Actions(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="actions" element="div" />
}

function Summary(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="summary" element="div" />
}

function Title({ children, className, style }: ChartWidgetSlotProps) {
  return <h2 className={['aperture-widget-title', className].filter(Boolean).join(' ')} style={style}>{children}</h2>
}

function Description({ children, className, style }: ChartWidgetSlotProps) {
  return <p className={['aperture-widget-description', className].filter(Boolean).join(' ')} style={style}>{children}</p>
}

function Period({ children, className, style }: ChartWidgetSlotProps) {
  return <p className={['aperture-widget-period', className].filter(Boolean).join(' ')} style={style}>{children}</p>
}

export interface ChartWidgetMetricProps {
  /** The host supplies the formatted value and its unit. */
  readonly value: ReactNode
  /** The host supplies the comparison or other explanation of the value. */
  readonly description?: ReactNode
}

function Metric({ value, description }: ChartWidgetMetricProps) {
  return (
    <div className="aperture-widget-metric">
      <p className="aperture-widget-value">{value}</p>
      {description === undefined ? null : <Description>{description}</Description>}
    </div>
  )
}

export interface ChartWidgetDetail {
  readonly label: string
  readonly value: ReactNode
}

export interface ChartWidgetDetailsProps {
  readonly items: readonly ChartWidgetDetail[]
}

function Details({ items }: ChartWidgetDetailsProps) {
  return (
    <dl className="aperture-widget-details">
      {items.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  )
}

function Plot(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="plot" element="div" />
}

function Footer(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="footer" element="footer" />
}

export const ChartWidget = { Root, Header, Title, Description, Period, Actions, Controls, Summary, Metric, Details, Plot, Footer }
