import type { CSSProperties } from 'react'
import type { ChartValue, DomChartDefinition } from '@tanstack/charts'
import { Chart as SvgChart } from '@tanstack/charts/react'
import { Chart as CanvasChart } from '@tanstack/charts/react/canvas'

export {
  areaY,
  barX,
  barY,
  cell,
  crosshair,
  defineChart,
  dot,
  facet,
  facetChart,
  lineX,
  lineY,
  link,
  rect,
  ruleX,
  ruleY,
  stack,
  text,
  tickX,
  tickY,
} from '@tanstack/charts'
export type {
  ChartControl,
  ChartDefinition,
  ChartPoint,
  ChartValue,
  DomChartDefinition,
} from '@tanstack/charts'
export { controlledSignal } from '@tanstack/charts/interaction/signal'
export { brushX as BrushX } from '@tanstack/charts/interaction/brush'
export type {
  BrushRange,
  BrushXChange,
  BrushXContinuousOptions,
  BrushXValuesOptions,
} from '@tanstack/charts/interaction/brush'
export { zoomX as ZoomX } from '@tanstack/charts/interaction/zoom'
export { scaleLinear } from '@tanstack/charts/scales/linear'
export type {
  ZoomXChange,
  ZoomXOptions,
  ZoomXWindow,
} from '@tanstack/charts/interaction/zoom'

export interface AdvancedChartProps<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
> {
  readonly definition: DomChartDefinition<TDatum, TXValue, TYValue>
  readonly renderer: 'svg' | 'canvas'
  readonly ariaLabel: string
  readonly ariaDescription: string
  readonly height?: number
  readonly className?: string
  readonly style?: CSSProperties
}

export function AdvancedChart<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
>({ renderer, ...props }: AdvancedChartProps<TDatum, TXValue, TYValue>) {
  return renderer === 'svg' ? <SvgChart {...props} /> : <CanvasChart {...props} />
}
