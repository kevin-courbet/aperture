import type { ComponentType, CSSProperties, ReactNode, SVGProps } from 'react'

export type ChartRenderer = 'svg' | 'canvas'

export type ApertureIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface ApertureIcons {
  readonly calendar: ApertureIcon
  readonly collapse: ApertureIcon
  readonly expand: ApertureIcon
  readonly table: ApertureIcon
}

export interface ApertureMessages {
  readonly controls: {
    readonly enterFullscreen: string
    readonly exitFullscreen: string
    readonly hideTable: string
    readonly showTable: string
    readonly timeRange: string
  }
  readonly states: {
    readonly empty: string
    readonly loading: string
  }
  readonly table: {
    readonly caption: string
  }
  readonly legend: {
    readonly missing: string
  }
  readonly errors: {
    readonly invalidDate: string
    readonly invalidHeight: string
    readonly invalidWidth: string
    readonly invalidNumber: string
    readonly missingFullscreenTarget: string
    readonly fullscreenFailed: string
  }
}

export interface PartialApertureMessages {
  readonly controls?: Partial<ApertureMessages['controls']>
  readonly states?: Partial<ApertureMessages['states']>
  readonly table?: Partial<ApertureMessages['table']>
  readonly legend?: Partial<ApertureMessages['legend']>
  readonly errors?: Partial<ApertureMessages['errors']>
}

export type NonEmptyReadonlyArray<TDatum> = readonly [TDatum, ...TDatum[]]

export type ChartDataState<TDatum> =
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly message?: string }
  | { readonly status: 'error'; readonly error: Error }
  | { readonly status: 'ready'; readonly data: NonEmptyReadonlyArray<TDatum> }

export type SingletonChartDataState<TDatum> =
  | { readonly status: 'loading' }
  | { readonly status: 'empty'; readonly message?: string }
  | { readonly status: 'error'; readonly error: Error }
  | { readonly status: 'ready'; readonly datum: TDatum }

export type NumericPoint =
  | { readonly kind: 'value'; readonly value: number }
  | { readonly kind: 'missing'; readonly reason: string }

export interface CommonChartProps {
  readonly ariaLabel: string
  readonly ariaDescription: string
  readonly renderer?: ChartRenderer
  readonly height?: number
  readonly width?: number
  readonly initialWidth?: number
  readonly className?: string
  readonly style?: CSSProperties
  readonly tooltip?: boolean
}

export interface CrosshairChartProps {
  readonly crosshair?: boolean
}

export type ChartSlot = 'root' | 'header' | 'controls' | 'plot' | 'footer'
export type ChartSlotClassNames = Partial<Record<ChartSlot, string>>

export interface ChartWidgetSlotProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

export function chartData<TDatum>(data: readonly TDatum[]): ChartDataState<TDatum> {
  return data.length === 0
    ? { status: 'empty' }
    : { status: 'ready', data: data as NonEmptyReadonlyArray<TDatum> }
}
