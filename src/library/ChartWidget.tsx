import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import type { ChartSlot, SlotClassNames } from './types'

type WidgetContextValue = {
  tableVisible: boolean
  setTableVisible: (value: boolean) => void
  slotClassNames?: SlotClassNames
}
const WidgetContext = createContext<WidgetContextValue | null>(null)

function useWidgetContext() {
  const context = useContext(WidgetContext)
  if (!context) throw new Error('ChartWidget parts must be children of ChartWidget.Root.')
  return context
}

type SlotProps = { children?: ReactNode; className?: string; style?: CSSProperties; slotClassNames?: SlotClassNames }
function slotClass(slot: ChartSlot, className: string | undefined, slotClassNames: SlotClassNames | undefined) {
  return ['chart-slot', `chart-slot-${slot}`, slotClassNames?.[slot], className].filter(Boolean).join(' ')
}

function Root({ children, className, style, slotClassNames }: SlotProps) {
  const [tableVisible, setTableVisible] = useState(false)
  return (
    <WidgetContext.Provider value={{ tableVisible, setTableVisible, slotClassNames }}>
      <section data-chart-slot="root" className={slotClass('root', className, slotClassNames)} style={style}>
        {children}
      </section>
    </WidgetContext.Provider>
  )
}

function Header({ children, ...props }: SlotProps) {
  const context = useWidgetContext()
  return <header data-chart-slot="header" className={slotClass('header', props.className, { ...context.slotClassNames, ...props.slotClassNames })} style={props.style}>{children}</header>
}
function Controls({ children, ...props }: SlotProps) {
  const context = useWidgetContext()
  return <div data-chart-slot="controls" className={slotClass('controls', props.className, { ...context.slotClassNames, ...props.slotClassNames })} style={props.style}>{children}</div>
}
function Plot({ children, ...props }: SlotProps) {
  const context = useWidgetContext()
  return <div data-chart-slot="plot" className={slotClass('plot', props.className, { ...context.slotClassNames, ...props.slotClassNames })} style={props.style}>{children}</div>
}
function Footer({ children, ...props }: SlotProps) {
  const context = useWidgetContext()
  return <footer data-chart-slot="footer" className={slotClass('footer', props.className, { ...context.slotClassNames, ...props.slotClassNames })} style={props.style}>{children}</footer>
}

function TableRegion({ children, ...props }: SlotProps) {
  const context = useWidgetContext()
  return context.tableVisible ? <div data-chart-slot="table" className={slotClass('table', props.className, { ...context.slotClassNames, ...props.slotClassNames })} style={props.style}>{children}</div> : null
}

export const ChartWidget = { Root, Header, Controls, Plot, Footer, TableRegion }
export { useWidgetContext }
