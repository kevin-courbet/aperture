import { createContext, useContext, type ReactNode } from 'react'
import { CalendarDays, Expand, Goal, Table2, TrendingUp } from 'lucide-react'
import type { IconSet, Messages } from './types'

const defaultIcons: IconSet = {
  fullscreen: Expand,
  table: Table2,
  target: Goal,
  trend: TrendingUp,
  calendar: CalendarDays,
}

export const englishMessages: Messages = {
  controls: {
    fullscreen: 'Enter full screen',
    exitFullscreen: 'Exit full screen',
    showTable: 'Show table',
    hideTable: 'Hide table',
    range: 'Time range',
    series: 'Series',
    goal: 'Goal',
  },
  dataTable: { caption: 'Exact chart values', date: 'Date', value: 'Value', target: 'Goal' },
  states: {
    loading: 'Data is loading.',
    empty: 'There is no data for this time range.',
    singleObservation: 'One result',
    trendRequiresTwo: 'A trend needs two or more results.',
  },
  ranges: { '1M': '1 month', '3M': '3 months', '6M': '6 months', All: 'All' },
  errors: {
    invalidValue: 'The value must be a finite number.',
    invalidDate: 'The date is not valid.',
    missingFullscreenTarget: 'The full-screen target is not available.',
    fullscreenFailed: 'The full-screen request failed.',
  },
}

type ProviderValue = {
  locale: string
  timeZone: string
  messages: Messages
  icons: IconSet
}

const ChartContext = createContext<ProviderValue | null>(null)

export type ChartProviderProps = {
  locale: string
  timeZone: string
  messages: Messages
  icons?: Partial<IconSet>
  children: ReactNode
}

export function ChartProvider({ locale, timeZone, messages, icons, children }: ChartProviderProps) {
  new Intl.DateTimeFormat(locale, { timeZone }).format()
  return (
    <ChartContext.Provider value={{ locale, timeZone, messages, icons: { ...defaultIcons, ...icons } }}>
      {children}
    </ChartContext.Provider>
  )
}

export function useChartConfig() {
  const context = useContext(ChartContext)
  if (!context) throw new Error('Chart components must be children of ChartProvider.')
  return context
}
