import type { CSSProperties, ReactNode } from 'react'
import type { ChartValue, DomChartDefinition } from '@tanstack/charts'
import { Chart as SvgChart, CanvasChart, RendererChart, type ChartTooltipBodyRenderContext } from '@tanstack/charts/react/tooltip'
import { useChartConfiguration } from './provider.js'
import { defaultChartHeight, defaultChartInitialWidth, useMotionRenderer } from './surface.js'
import type { ChartRendering } from './types.js'
import { positiveHeight, positiveWidth } from './validation.js'

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
export { tooltip } from '@tanstack/charts/tooltip'
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
  readonly rendering?: ChartRendering
  readonly ariaLabel: string
  readonly ariaDescription: string
  readonly height?: number
  readonly width?: number
  readonly initialWidth?: number
  readonly className?: string
  readonly style?: CSSProperties
  readonly renderTooltipBody?: (
    context: ChartTooltipBodyRenderContext<TDatum, TXValue, TYValue>,
  ) => ReactNode
}

export function AdvancedChart<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
>({ rendering = { kind: 'svg' }, width, height = defaultChartHeight, initialWidth = defaultChartInitialWidth, className, style, renderTooltipBody, ...props }: AdvancedChartProps<TDatum, TXValue, TYValue>) {
  const { messages } = useChartConfiguration()
  positiveHeight(height, messages.errors.invalidHeight)
  if (width !== undefined) positiveWidth(width, messages.errors.invalidWidth)
  positiveWidth(initialWidth, messages.errors.invalidWidth)
  const renderer = useMotionRenderer<TDatum, TXValue, TYValue>(rendering)
  const chartProps = { ...props, width, height, initialWidth, renderTooltipBody }
  return (
    <div
      data-aperture-root=""
      data-aperture-renderer={rendering.kind}
      className={['aperture-chart', className].filter(Boolean).join(' ')}
      style={{ ...style, ...(width === undefined ? {} : { width }) }}
    >
      {rendering.kind === 'svg'
        ? <SvgChart {...chartProps} />
        : rendering.kind === 'canvas'
          ? <CanvasChart {...chartProps} />
          : <RendererChart {...chartProps} renderer={renderer!} />}
    </div>
  )
}
