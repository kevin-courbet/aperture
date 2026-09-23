import { useMemo, useRef, type ReactNode } from 'react'
import type { ChartValue, DomChartDefinition } from '@tanstack/charts'
import { motion } from '@tanstack/charts/motion'
import { Chart as SvgChart, CanvasChart, RendererChart } from '@tanstack/charts/react/tooltip'
import { useChartConfiguration } from './provider.js'
import { ExactValues, SemanticLegend, type ExactValueModel, type SemanticLegendItem } from './exact-values.js'
import type { ChartDataState, ChartRendering, ChartTooltipOptions, CommonChartProps, SingletonChartDataState } from './types.js'
import { positiveHeight, positiveWidth } from './validation.js'
import { ChartToolbar } from './controls.js'
import { ChartWidget, useOptionalChartWidget } from './widget.js'
import { useFullscreenSize } from './fullscreen-size.js'

export const defaultChartHeight = 320
export const defaultChartInitialWidth = 640

function validateMotionNumber(value: number | undefined, minimum: number, message: string, minimumAllowed = true) {
  if (value === undefined) return
  if (!Number.isFinite(value) || (minimumAllowed ? value < minimum : value <= minimum)) {
    throw new RangeError(message)
  }
}

export function useMotionRenderer<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
>(rendering: ChartRendering) {
  const kind: string = rendering.kind
  if (kind !== 'svg' && kind !== 'canvas' && kind !== 'motion') {
    throw new RangeError(`Unknown chart rendering kind: ${kind}`)
  }
  const options = rendering.kind === 'motion' ? rendering.options : undefined
  if (options !== undefined && (typeof options !== 'object' || options === null || Array.isArray(options))) {
    throw new TypeError('Motion options must be an object.')
  }
  const initial = options?.initial
  const resize = options?.resize
  const transition = options?.transition
  for (const [value, name] of [
    [initial, 'initial'],
    [resize, 'resize'],
  ] as const) {
    if (value !== undefined && typeof value !== 'boolean') {
      throw new TypeError(`Motion ${name} must be a boolean.`)
    }
  }
  if (transition !== undefined && (typeof transition !== 'object' || transition === null || Array.isArray(transition))) {
    throw new TypeError('Motion transition must be an object.')
  }
  const transitionType = transition?.type
  if (transition !== undefined && transitionType === undefined) {
    throw new TypeError('Motion transition type is required.')
  }
  if (transitionType !== undefined && transitionType !== 'tween' && transitionType !== 'spring') {
    throw new RangeError(`Unknown motion transition type: ${String(transitionType)}`)
  }
  if (transition !== undefined) {
    const fields = transition as unknown as Readonly<Record<string, unknown>>
    const invalidFields = transitionType === 'tween'
      ? ['stiffness', 'damping', 'mass', 'restSpeed', 'restDelta']
      : ['duration', 'easing']
    const invalidField = invalidFields.find((field) => fields[field] !== undefined)
    if (invalidField !== undefined) {
      throw new TypeError(`Motion ${transitionType} transition does not accept ${invalidField}.`)
    }
  }
  const duration = transitionType === 'tween' ? transition?.duration : undefined
  const easing = transitionType === 'tween' ? transition?.easing : undefined
  const stiffness = transitionType === 'spring' ? transition?.stiffness : undefined
  const damping = transitionType === 'spring' ? transition?.damping : undefined
  const mass = transitionType === 'spring' ? transition?.mass : undefined
  const restSpeed = transitionType === 'spring' ? transition?.restSpeed : undefined
  const restDelta = transitionType === 'spring' ? transition?.restDelta : undefined
  if (easing !== undefined && !['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(easing)) {
    throw new RangeError(`Unknown motion easing: ${String(easing)}`)
  }
  validateMotionNumber(duration, 0, 'Motion tween duration must be a nonnegative finite number.')
  validateMotionNumber(stiffness, 0, 'Motion spring stiffness must be a positive finite number.', false)
  validateMotionNumber(damping, 0, 'Motion spring damping must be a nonnegative finite number.')
  validateMotionNumber(mass, 0, 'Motion spring mass must be a positive finite number.', false)
  validateMotionNumber(restSpeed, 0, 'Motion spring rest speed must be a positive finite number.', false)
  validateMotionNumber(restDelta, 0, 'Motion spring rest delta must be a positive finite number.', false)

  return useMemo(() => {
    if (kind !== 'motion') return undefined
    const stableTransition = transitionType === 'tween'
      ? { type: transitionType, duration, easing } as const
      : transitionType === 'spring'
        ? { type: transitionType, stiffness, damping, mass, restSpeed, restDelta } as const
        : undefined
    return motion<TDatum, TXValue, TYValue>({
      initial,
      transition: stableTransition,
      respectReducedMotion: true,
      resize,
    })
  }, [
    kind,
    initial,
    resize,
    transitionType,
    duration,
    easing,
    stiffness,
    damping,
    mass,
    restSpeed,
    restDelta,
  ])
}

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
  rendering = { kind: 'svg' },
  ariaLabel,
  ariaDescription,
  height = defaultChartHeight,
  width,
  initialWidth = defaultChartInitialWidth,
  className,
  style,
  formatters,
  exactValues,
  legend = [],
  tooltip,
  dataTableControl = 'hidden',
  defaultTableVisible = false,
}: ChartSurfaceProps<TDatum, TXValue, TYValue>) {
  const widget = useOptionalChartWidget()
  const standaloneRef = useRef<HTMLElement>(null)
  const fullscreen = useFullscreenSize()
  if (typeof defaultTableVisible !== 'boolean') {
    throw new TypeError('Chart defaultTableVisible must be a boolean.')
  }
  const { messages } = useChartConfiguration()
  positiveHeight(height, messages.errors.invalidHeight)
  if (width !== undefined) positiveWidth(width, messages.errors.invalidWidth)
  positiveWidth(initialWidth, messages.errors.invalidWidth)
  const chartProps = { definition, ariaLabel, ariaDescription,
    height: fullscreen.size?.height ?? height,
    width: fullscreen.size?.width ?? width, initialWidth }
  const motionRenderer = useMotionRenderer<TDatum, TXValue, TYValue>(rendering)
  const customTooltipBody = typeof tooltip === 'object' ? tooltip.renderBody : undefined
  const renderTooltipBody = customTooltipBody === undefined
    ? undefined
    : (context: Parameters<NonNullable<ChartTooltipOptions['renderBody']>>[0] & { readonly defaultBody: ReactNode }) =>
        customTooltipBody(context)

  const content = (
    <div
      data-aperture-root={widget === null ? undefined : ''}
      data-aperture-renderer={rendering.kind}
      className={['aperture-chart', className].filter(Boolean).join(' ')}
      style={widget === null ? undefined : { ...style, ...(width === undefined ? {} : { width }) }}
    >
      <div ref={fullscreen.ref} className="aperture-canvas" style={{ height }}>
      {rendering.kind === 'svg'
        ? <SvgChart {...chartProps} renderTooltipBody={renderTooltipBody} />
        : rendering.kind === 'canvas'
          ? <CanvasChart {...chartProps} renderTooltipBody={renderTooltipBody} />
          : <RendererChart {...chartProps} renderer={motionRenderer!} renderTooltipBody={renderTooltipBody} />}
      </div>
      <SemanticLegend items={legend} />
      <ExactValues model={exactValues} formatters={formatters} />
    </div>
  )
  if (widget !== null) return content
  return (
    <ChartWidget.Root
      ref={standaloneRef}
      exactValues="available"
      defaultTableVisible={defaultTableVisible}
      className="aperture-standalone"
      style={{ ...style, ...(width === undefined ? {} : { width }) }}
    >
      <ChartToolbar targetRef={standaloneRef} dataTableControl={dataTableControl} />
      {content}
    </ChartWidget.Root>
  )
}

export interface ChartStateBoundaryProps<TDatum> {
  readonly state: ChartDataState<TDatum>
  readonly rootProps: Pick<CommonChartProps, 'ariaLabel' | 'ariaDescription' | 'height' | 'width' | 'initialWidth' | 'className' | 'style'>
  readonly children: (data: readonly [TDatum, ...TDatum[]]) => ReactNode
}

export function ChartStateBoundary<TDatum>({
  state,
  rootProps,
  children,
}: ChartStateBoundaryProps<TDatum>) {
  const { messages } = useChartConfiguration()
  const { ariaLabel, ariaDescription, height = defaultChartHeight, width, initialWidth = defaultChartInitialWidth, className, style } = rootProps
  positiveHeight(height, messages.errors.invalidHeight)
  if (width !== undefined) positiveWidth(width, messages.errors.invalidWidth)
  positiveWidth(initialWidth, messages.errors.invalidWidth)

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
      style={{ minHeight: height, ...style, ...(width === undefined ? {} : { width }) }}
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
  readonly rootProps: Pick<CommonChartProps, 'ariaLabel' | 'ariaDescription' | 'height' | 'width' | 'initialWidth' | 'className' | 'style'>
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
