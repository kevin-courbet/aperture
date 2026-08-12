import type { ComponentType, SVGProps } from 'react'

export type Icon = ComponentType<SVGProps<SVGSVGElement>>

export type IconSet = {
  fullscreen: Icon
  table: Icon
  target: Icon
  trend: Icon
  calendar: Icon
}

export type Messages = {
  controls: {
    fullscreen: string
    exitFullscreen: string
    showTable: string
    hideTable: string
    range: string
    series: string
    goal: string
  }
  dataTable: { caption: string; date: string; value: string; target: string }
  states: {
    loading: string
    empty: string
    singleObservation: string
    trendRequiresTwo: string
  }
  ranges: Record<TimeRange, string>
  errors: { invalidValue: string; invalidDate: string; missingFullscreenTarget: string; fullscreenFailed: string }
}

export type NonEmptyReadonlyArray<TDatum> = readonly [TDatum, ...TDatum[]]

export type ChartDataState<TDatum> =
  | { status: 'loading' }
  | { status: 'empty'; message?: string }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: NonEmptyReadonlyArray<TDatum> }

export function readyChartData<TDatum>(data: readonly TDatum[]): ChartDataState<TDatum> {
  if (data.length === 0) return { status: 'empty' }
  return { status: 'ready', data: data as NonEmptyReadonlyArray<TDatum> }
}

export type YFormatter =
  | { kind: 'number'; maximumFractionDigits?: number; unit?: string }
  | { kind: 'percent'; maximumFractionDigits?: number }
  | { kind: 'currency'; currency: string; maximumFractionDigits?: number }

export type TimeRange = '1M' | '3M' | '6M' | 'All'

export type ChartGoal = {
  value: number
  label: string
}

export type ChartSlot = 'root' | 'header' | 'controls' | 'plot' | 'table' | 'footer'

export type SlotClassNames = Partial<Record<ChartSlot, string>>
