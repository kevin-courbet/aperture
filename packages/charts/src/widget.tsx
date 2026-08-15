import {
  createContext,
  use,
  useId,
  useState,
} from 'react'
import type {
  ChartSlot,
  ChartSlotClassNames,
  ChartWidgetSlotProps,
} from './types.js'

interface InternalWidgetContextValue {
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
  const [uncontrolledVisible, setUncontrolledVisible] = useState(defaultTableVisible ?? false)
  const visible = tableVisible ?? uncontrolledVisible

  function setVisible(next: boolean) {
    if (tableVisible === undefined) setUncontrolledVisible(next)
    onTableVisibleChange?.(next)
  }

  return (
    <WidgetContext
      value={{ tableId, tableAvailable: exactValues === 'available', tableVisible: visible, setTableVisible: setVisible, slotClassNames }}
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

function Plot(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="plot" element="div" />
}

function Footer(props: ChartWidgetSlotProps) {
  return <Slot {...props} slot="footer" element="footer" />
}

export const ChartWidget = { Root, Header, Controls, Plot, Footer }
