import type { ComponentType, CSSProperties, ReactNode, SVGProps } from 'react'

export type ChartRenderer = 'svg' | 'canvas' | 'motion'

export type ChartMotionTransition =
  | {
      readonly type: 'tween'
      readonly duration?: number
      readonly easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
    }
  | {
      readonly type: 'spring'
      readonly stiffness?: number
      readonly damping?: number
      readonly mass?: number
      readonly restSpeed?: number
      readonly restDelta?: number
    }

export interface ChartMotionOptions {
  readonly initial?: boolean
  readonly transition?: ChartMotionTransition
  readonly resize?: boolean
}

export type ChartRendering =
  | { readonly kind: 'svg' }
  | { readonly kind: 'canvas' }
  | { readonly kind: 'motion'; readonly options?: ChartMotionOptions }

export type ApertureChartColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type ApertureChartStyle = CSSProperties & Partial<
  Record<`--aperture-chart-${ApertureChartColorIndex}`, string>
>

export interface ChartFormatters {
  readonly date?: (value: Date) => string
  readonly axisNumber?: (value: number) => string
  readonly number?: (value: number) => string
  readonly percentage?: (value: number) => string
}

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

export type ChartTooltipValue = Date | number | string

export interface ChartTooltipPoint {
  readonly key: string
  readonly markId: string
  readonly groupLabel: string
  readonly datum: unknown
  readonly datumIndex: number
  readonly xValue: ChartTooltipValue
  readonly yValue: ChartTooltipValue
  readonly color: string
}

export interface ChartTooltipTotal {
  readonly label: string
  readonly value: string
}

export interface ChartTooltipRenderContext {
  readonly points: readonly ChartTooltipPoint[]
  readonly defaultBody: ReactNode
  readonly pinned: boolean
  readonly dismiss: () => void
}

export interface ChartTooltipOptions {
  readonly renderBody?: (context: ChartTooltipRenderContext) => ReactNode
}

export interface GroupedChartTooltipOptions extends ChartTooltipOptions {
  readonly groupedTotal?: (
    points: readonly ChartTooltipPoint[],
  ) => ChartTooltipTotal | undefined
}

export interface CommonChartProps {
  readonly ariaLabel: string
  readonly ariaDescription: string
  readonly rendering?: ChartRendering
  readonly height?: number
  readonly width?: number
  readonly initialWidth?: number
  readonly className?: string
  readonly style?: ApertureChartStyle
  readonly tooltip?: boolean | ChartTooltipOptions
  readonly formatters?: ChartFormatters
}

export type GroupedCommonChartProps = Omit<CommonChartProps, 'tooltip'> & {
  readonly tooltip?: boolean | GroupedChartTooltipOptions
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
