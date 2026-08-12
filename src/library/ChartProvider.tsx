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

export const frenchMessages: Messages = {
  controls: {
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    showTable: 'Afficher le tableau',
    hideTable: 'Masquer le tableau',
    range: 'Période',
    series: 'Série',
    goal: 'Objectif',
  },
  dataTable: { caption: 'Valeurs exactes du graphique', date: 'Mois', value: 'Valeur', target: 'Objectif' },
  states: {
    loading: 'Chargement des données…',
    empty: 'Aucune donnée pour cette période.',
    singleObservation: 'Observation unique',
    trendRequiresTwo: 'Une tendance nécessite au moins deux observations.',
  },
  ranges: { '1M': '1 mois', '3M': '3 mois', '6M': '6 mois', All: 'Tout' },
  errors: {
    invalidValue: 'La donnée doit être un nombre fini.',
    invalidDate: 'La date doit être valide.',
    missingFullscreenTarget: 'Le conteneur du graphique est indisponible.',
    fullscreenFailed: 'Le plein écran a échoué.',
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
  if (!context) throw new Error('ChartProvider is required around chart components.')
  return context
}
