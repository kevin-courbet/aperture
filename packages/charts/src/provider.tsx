import { createContext, use, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, Expand, Minimize2, Table2, X } from 'lucide-react'
import type {
  ApertureIcons,
  ApertureMessages,
  PartialApertureMessages,
} from './types.js'

export const englishMessages: ApertureMessages = {
  controls: {
    enterFullscreen: 'Enter full screen',
    exitFullscreen: 'Exit full screen',
    hideTable: 'Hide exact values',
    showTable: 'Show exact values',
    timeRange: 'Time range',
  },
  states: {
    empty: 'There is no data to show.',
    loading: 'Data is loading.',
  },
  table: { caption: 'Exact chart values' },
  legend: { missing: 'Missing value' },
  annotations: { highlights: 'Highlights' },
  selection: {
    instructions: 'Select a mark with a click, Enter, or Space. Select it again to clear the selection.',
    selected: 'Selected',
  },
  stat: {
    increase: 'Increase',
    decrease: 'Decrease',
    noChange: 'No change',
    better: 'better',
    worse: 'worse',
  },
  sparkline: {
    summary: 'From {first} on {firstDate} to {last} on {lastDate}. Lowest {minimum}. Highest {maximum}.',
  },
  filters: {
    group: 'Filters',
    active: 'Active filters',
    none: 'No filters applied.',
    remove: 'Remove filter',
    clearAll: 'Clear all filters',
  },
  errors: {
    invalidDate: 'Chart dates must be valid Date values.',
    invalidHeight: 'Chart height must be a positive finite number.',
    invalidWidth: 'Chart widths must be positive finite numbers.',
    invalidNumber: 'Chart numbers must be finite.',
    missingFullscreenTarget: 'The full-screen target is not available.',
    fullscreenFailed: 'The full-screen request failed.',
  },
}

export const defaultIcons: ApertureIcons = {
  calendar: CalendarDays,
  chevron: ChevronDown,
  collapse: Minimize2,
  expand: Expand,
  remove: X,
  table: Table2,
}

interface ChartConfiguration {
  readonly locale: string
  readonly timeZone: string
  readonly messages: ApertureMessages
  readonly icons: ApertureIcons
}

const defaultConfiguration: ChartConfiguration = {
  locale: 'en-GB',
  timeZone: 'UTC',
  messages: englishMessages,
  icons: defaultIcons,
}

const ChartContext = createContext<ChartConfiguration>(defaultConfiguration)

export interface ChartProviderProps {
  readonly children: ReactNode
  readonly locale?: string
  readonly timeZone?: string
  readonly messages?: PartialApertureMessages
  readonly icons?: Partial<ApertureIcons>
}

export function ChartProvider({
  children,
  locale = defaultConfiguration.locale,
  timeZone = defaultConfiguration.timeZone,
  messages,
  icons,
}: ChartProviderProps) {
  new Intl.DateTimeFormat(locale, { timeZone }).format(0)
  const mergedMessages: ApertureMessages = {
    controls: { ...englishMessages.controls, ...messages?.controls },
    states: { ...englishMessages.states, ...messages?.states },
    table: { ...englishMessages.table, ...messages?.table },
    legend: { ...englishMessages.legend, ...messages?.legend },
    annotations: { ...englishMessages.annotations, ...messages?.annotations },
    selection: { ...englishMessages.selection, ...messages?.selection },
    filters: { ...englishMessages.filters, ...messages?.filters },
    stat: { ...englishMessages.stat, ...messages?.stat },
    sparkline: { ...englishMessages.sparkline, ...messages?.sparkline },
    errors: { ...englishMessages.errors, ...messages?.errors },
  }

  return (
    <ChartContext
      value={{
        locale,
        timeZone,
        messages: mergedMessages,
        icons: { ...defaultIcons, ...icons },
      }}
    >
      {children}
    </ChartContext>
  )
}

export function useChartConfiguration(): ChartConfiguration {
  return use(ChartContext)
}
