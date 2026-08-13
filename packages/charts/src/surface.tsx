import type { ReactNode } from 'react'
import type { ChartValue, DomChartDefinition } from '@tanstack/charts'
import { Chart as SvgChart } from '@tanstack/charts/react'
import { Chart as CanvasChart } from '@tanstack/charts/react/canvas'
import { useChartConfiguration } from './provider.js'
import { ExactValues, SemanticLegend, type ExactValueModel, type SemanticLegendItem } from './exact-values.js'
import type { ChartDataState, CommonChartProps, SingletonChartDataState } from './types.js'
import { positiveHeight } from './validation.js'

export const defaultChartHeight = 320

interface ChartSurfaceProps<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
> extends CommonChartProps {
  readonly definition: DomChartDefinition<TDatum, TXValue, TYValue>
  readonly exactValues: ExactValueModel
  readonly legend?: readonly SemanticLegendItem[]
}

export function ChartSurface<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
>({
  definition,
  renderer = 'svg',
  ariaLabel,
  ariaDescription,
  height = defaultChartHeight,
  className,
  style,
  exactValues,
  legend = [],
  accessibleExactValues,
}: ChartSurfaceProps<TDatum, TXValue, TYValue>) {
  const { messages } = useChartConfiguration()
  positiveHeight(height, messages.errors.invalidHeight)
  const chartProps = { definition, ariaLabel, ariaDescription, height }

  return (
    <div
      data-aperture-root=""
      data-aperture-renderer={renderer}
      className={['aperture-chart', className].filter(Boolean).join(' ')}
      style={style}
    >
      {renderer === 'svg' ? <SvgChart {...chartProps} /> : <CanvasChart {...chartProps} />}
      <SemanticLegend items={legend} />
      <ExactValues model={exactValues} replacement={accessibleExactValues} />
    </div>
  )
}

export interface ChartStateBoundaryProps<TDatum> {
  readonly state: ChartDataState<TDatum>
  readonly rootProps: Pick<CommonChartProps, 'ariaLabel' | 'ariaDescription' | 'height' | 'className' | 'style'>
  readonly children: (data: readonly [TDatum, ...TDatum[]]) => ReactNode
}

export function ChartStateBoundary<TDatum>({
  state,
  rootProps,
  children,
}: ChartStateBoundaryProps<TDatum>) {
  const { messages } = useChartConfiguration()
  const { ariaLabel, ariaDescription, height = defaultChartHeight, className, style } = rootProps
  positiveHeight(height, messages.errors.invalidHeight)

  if (state.status === 'ready') return children(state.data)

  const text =
    state.status === 'loading'
      ? messages.states.loading
      : state.status === 'empty'
        ? (state.message ?? messages.states.empty)
        : state.error.message

  const role = state.status === 'error' ? 'alert' : state.status === 'loading' ? 'status' : 'region'
  return (
    <div
      data-aperture-root=""
      className={['aperture-chart', 'aperture-state', className].filter(Boolean).join(' ')}
      style={{ minHeight: height, ...style }}
      role={role}
      aria-label={ariaLabel}
      aria-description={ariaDescription}
    >
      {text}
    </div>
  )
}

export interface SingletonChartStateBoundaryProps<TDatum> {
  readonly state: SingletonChartDataState<TDatum>
  readonly rootProps: Pick<CommonChartProps, 'ariaLabel' | 'ariaDescription' | 'height' | 'className' | 'style'>
  readonly children: (data: TDatum) => ReactNode
}

export function SingletonChartStateBoundary<TDatum>({
  state,
  rootProps,
  children,
}: SingletonChartStateBoundaryProps<TDatum>) {
  const collectionState: ChartDataState<TDatum> = state.status === 'ready'
    ? { status: 'ready', data: [state.datum] }
    : state
  return (
    <ChartStateBoundary state={collectionState} rootProps={rootProps}>
      {(data) => children(data[0])}
    </ChartStateBoundary>
  )
}
