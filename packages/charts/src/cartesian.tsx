import {
  areaY,
  barX,
  barY,
  cell,
  crosshair as crosshairMark,
  defineChart,
  dot,
  facetChart,
  group,
  lineY,
  link,
  rect,
  ruleY,
  stack,
  text,
  tickY,
  waterfall,
} from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { brushX, type BrushXChange } from '@tanstack/charts/interaction/brush'
import { controlledSignal } from '@tanstack/charts/interaction/signal'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { scaleLinear as scaleLinearColor, scaleUtc } from 'd3-scale'
import { curveMonotoneX } from 'd3-shape'
import { useId } from 'react'
import { exactRow, exactValues, lineSeriesDasharrays, pointSeriesStyles, seriesLegend, type SemanticLegendItem } from './exact-values.js'
import { localizedHorizontalTooltip, localizedTooltip, numberAxis, useChartFormatters } from './formatting.js'
import { chartColors } from './palette.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, ChartSurface } from './surface.js'
import { observationTickFormatter, planTimeAxis, timeIntervalNeighbors, type CalendarTickInterval, type ElapsedTimeAxisOptions, type TimeAxisOptions } from './time-axis.js'
import type { ChartDataState, CommonChartProps, CrosshairChartProps, NumericPoint } from './types.js'
import { bounded, finite, increasingDomain, numericPoint, positiveRadius, validCandlestick, validDate, validErrorInterval, validHistogramBin, validRange } from './validation.js'

export type CartesianInterpolation = 'linear' | 'monotone-x'

export interface DateRange {
  readonly start: Date
  readonly end: Date
}

export interface DateBrush {
  readonly value: DateRange
  readonly onChange: (value: DateRange) => void
  readonly ariaLabel: string
  readonly startAriaLabel: string
  readonly endAriaLabel: string
  readonly appearance?: 'standard' | 'low-emphasis'
}

export type AreaFillAppearance =
  | { readonly kind: 'solid'; readonly opacity?: number }
  | { readonly kind: 'vertical-gradient'; readonly topOpacity?: number; readonly bottomOpacity?: number }

export interface AreaAppearance {
  readonly fill: AreaFillAppearance
  readonly outline?: { readonly width?: number }
}

function areaPaint(
  series: readonly string[],
  appearance: AreaAppearance | undefined,
  defaultOpacity: number,
  idPrefix: string,
) {
  const fill = appearance?.fill ?? { kind: 'solid' as const, opacity: defaultOpacity }
  const outlineWidth = appearance?.outline?.width ?? 0
  if (outlineWidth < 0 || !Number.isFinite(outlineWidth)) {
    throw new RangeError('Area outline width must be a nonnegative finite number.')
  }
  const colors = new Map(series.map((name, index) => [name, chartColors[index % chartColors.length]!] as const))
  const stroke = outlineWidth === 0 ? undefined : (row: { readonly series: string }) => colors.get(row.series) ?? chartColors[0]
  if (fill.kind === 'solid') {
    const opacity = bounded(fill.opacity ?? defaultOpacity, 0, 1, 'Area fill opacity must be between zero and one.')
    return { fill: (row: { readonly series: string }) => colors.get(row.series) ?? chartColors[0], fillOpacity: opacity, gradients: [], stroke, strokeWidth: outlineWidth }
  }
  const topOpacity = bounded(fill.topOpacity ?? 0.4, 0, 1, 'Area gradient opacity must be between zero and one.')
  const bottomOpacity = bounded(fill.bottomOpacity ?? 0.05, 0, 1, 'Area gradient opacity must be between zero and one.')
  const gradientIds = new Map(series.map((name, index) => [name, `${idPrefix}-${index + 1}`] as const))
  return {
    fill: (row: { readonly series: string }) => `url(#${gradientIds.get(row.series) ?? `${idPrefix}-1`})`,
    fillOpacity: 1,
    gradients: series.map((name, index) => ({
      id: gradientIds.get(name)!,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
      stops: [
        { offset: 0, color: chartColors[index % chartColors.length]!, opacity: topOpacity },
        { offset: 1, color: chartColors[index % chartColors.length]!, opacity: bottomOpacity },
      ],
    })),
    stroke,
    strokeWidth: outlineWidth,
  }
}

const monotoneXCurve = d3Curve(curveMonotoneX)

interface TimeSeriesRow {
  readonly id: string
  readonly date: Date
  readonly value: number | null
  readonly series: string
}

export interface TimeSeriesDatum {
  readonly id: string
  readonly date: Date
  readonly value: NumericPoint
  readonly series?: string
}

export interface LineChartProps extends CommonChartProps, CrosshairChartProps {
  readonly state: ChartDataState<TimeSeriesDatum>
  readonly xLabel?: string
  readonly yLabel?: string
  readonly showPoints?: boolean
  readonly reference?: { readonly value: number; readonly label: string }
  readonly timeAxis?: TimeAxisOptions
}

function timeRows(
  data: readonly TimeSeriesDatum[],
  invalidDate: string,
  invalidNumber: string,
): TimeSeriesRow[] {
  return data.map((datum) => ({
    id: datum.id,
    date: validDate(datum.date, invalidDate),
    value: numericPoint(datum.value, invalidNumber),
    series: datum.series ?? 'Value',
  }))
}

function uniqueDateValues(dates: readonly Date[]): readonly Date[] {
  const seen = new Set<number>()
  const values: Date[] = []
  for (const date of dates) {
    const timestamp = date.getTime()
    if (seen.has(timestamp)) continue
    seen.add(timestamp)
    values.push(new Date(timestamp))
  }
  return values
}

function timeXAxis(
  dates: readonly Date[],
  width: number,
  locale: string,
  timeZone: string,
  options: TimeAxisOptions | undefined,
  label: string | undefined,
  dateFormatOverride: ((value: Date) => string) | undefined,
) {
  if (options !== undefined && options.position !== 'elapsed' && options.position !== 'observations') {
    throw new RangeError('Time-axis positions must be elapsed or observations.')
  }
  if (options?.position === 'observations' && 'ticks' in options) {
    throw new RangeError('Observation-position time axes do not accept a tick policy.')
  }
  const position = options?.position ?? 'elapsed'
  const ticks = options?.position === 'observations' ? { kind: 'observations' as const } : options?.ticks
  const time = planTimeAxis({
    dates,
    width,
    locale,
    timeZone,
    options: ticks,
  })
  const observations = uniqueDateValues(dates)
  const format = options?.format ?? dateFormatOverride
  const observationTicks = position === 'observations'
    ? selectEvenly(observations, time.axis.ticks.values.length)
    : time.axis.ticks.values
  const observationFormat = position === 'observations'
    ? observationTickFormatter(observationTicks, locale, timeZone, observations)
    : undefined
  const axis = {
    ...time.axis,
    ticks: {
      ...time.axis.ticks,
      values: observationTicks,
      ...(format === undefined
        ? observationFormat === undefined ? {} : { format: observationFormat }
        : { format }),
    },
    ...(label === undefined ? {} : { label }),
  }
  return {
    scale: position === 'observations'
      ? () => scalePoint<Date>().domain(observations).padding(0.5)
      : scaleUtc().domain(time.domain),
    axis,
  }
}

function selectEvenly<TValue>(values: readonly TValue[], count: number): readonly TValue[] {
  if (values.length <= count) return values
  return Array.from({ length: count }, (_, index) =>
    values[Math.round(index * (values.length - 1) / (count - 1))]!)
}

export function LineChart({ state, xLabel, yLabel, showPoints = true, reference, timeAxis, ...common }: LineChartProps) {
  const { messages, locale, timeZone } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  const referenceValue = reference === undefined ? undefined : finite(reference.value, 'LineChart reference value must be finite.')
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = timeRows(data, messages.errors.invalidDate, messages.errors.invalidNumber)
        const series = [...new Set(rows.map((row) => row.series))]
        seriesLegend(series)
        const rowsBySeries = new Map(series.map((name) => [name, [] as TimeSeriesRow[]]))
        for (const row of rows) rowsBySeries.get(row.series)!.push(row)
        const seriesPresentation = new Map(series.map((name) => {
          const presentDates = new Set(rowsBySeries.get(name)!
            .filter((row) => row.value !== null)
            .map((row) => row.date.getTime())).size
          return [name, presentDates === 0 ? 'missing' : presentDates === 1 ? 'point' : 'line'] as const
        }))
        const lineMarks = series.flatMap((name, index) => {
          const seriesRows = rowsBySeries.get(name)!
          const presentation = seriesPresentation.get(name)
          if (presentation === 'missing') return []
          if (presentation === 'line') {
            return [lineY(seriesRows, {
              x: 'date', y: 'value', color: 'series', key: 'id', points: showPoints,
              strokeWidth: 2.25, strokeDasharray: lineSeriesDasharrays[index],
            })]
          }
          const pointStyle = pointSeriesStyles[index] ?? pointSeriesStyles[0]
          return [dot(seriesRows.filter((row) => row.value !== null), {
            x: 'date',
            y: 'value',
            key: 'id',
            r: pointStyle.radius,
            fill: pointStyle.hollow ? 'var(--aperture-color-background)' : chartColors[index],
            stroke: chartColors[index],
            strokeWidth: pointStyle.hollow ? 2 : 0,
          })]
        })
        const dates = rows.map((row) => row.date)
        const marks = [
          ...lineMarks,
          ...(referenceValue === undefined ? [] : [ruleY([referenceValue], { stroke: 'var(--aperture-color-text)', strokeDasharray: '6 4', strokeWidth: 1.5 })]),
          ...(common.crosshair ? [crosshairMark({ x: true, y: false, marker: true })] : []),
        ]
        const definition = defineChart({
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
          chart: ({ width }) => {
            return {
              marks,
              x: timeXAxis(dates, width, locale, timeZone, timeAxis, xLabel, common.formatters?.date),
              y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
              color: { domain: series, range: chartColors },
            }
          },
        })
        const legend: SemanticLegendItem[] = [...seriesLegend(
          series,
          (name) => seriesPresentation.get(name) ?? 'missing',
        )]
        if (reference !== undefined && referenceValue !== undefined) legend.push({ kind: 'reference', label: reference.label, detail: formatters.number(referenceValue) })
        if (data.some((datum) => datum.value.kind === 'missing')) legend.push({ kind: 'missing', label: messages.legend.missing })
        return <ChartSurface {...common} definition={definition} legend={legend} exactValues={exactValues(
          ['Date', 'Series', 'Value'],
          data.map((datum) => exactRow(datum.id, datum.date, datum.series ?? 'Value', datum.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface AreaDatum {
  readonly id: string
  readonly date: Date
  readonly value: NumericPoint
}

export interface AreaChartProps extends CommonChartProps, CrosshairChartProps {
  readonly state: ChartDataState<AreaDatum>
  readonly xLabel?: string
  readonly yLabel?: string
  readonly timeAxis?: TimeAxisOptions
  readonly appearance?: AreaAppearance
}

export function AreaChart({ state, xLabel, yLabel, timeAxis, appearance, ...common }: AreaChartProps) {
  const { messages, locale, timeZone } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  const gradientIdPrefix = `aperture-area-${useId().replaceAll(':', '')}`
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = timeRows(data, messages.errors.invalidDate, messages.errors.invalidNumber)
        const oneObservation = new Set(rows.map((row) => row.date.getTime())).size === 1
        const paint = areaPaint(['Value'], appearance, 0.32, gradientIdPrefix)
        const marks = [
          oneObservation
            ? dot(rows.filter((row) => row.value !== null), { x: 'date', y: 'value', key: 'id', r: 4.5, fill: 'var(--aperture-chart-1)' })
            : areaY(rows, {
                x: 'date', y1: () => 0, y2: 'value', key: 'id', fill: paint.fill,
                fillOpacity: paint.fillOpacity, stroke: paint.stroke, strokeWidth: paint.strokeWidth,
              }),
          ...(common.crosshair ? [crosshairMark({ x: true, y: false })] : []),
        ]
        const dates = rows.map((row) => row.date)
        const definition = defineChart({
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
          chart: ({ width }) => {
            return {
              marks,
              gradients: paint.gradients,
              x: timeXAxis(dates, width, locale, timeZone, timeAxis, xLabel, common.formatters?.date),
              y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
            }
          },
        })
        const legend: SemanticLegendItem[] = [{ label: 'Value' }]
        if (data.some((datum) => datum.value.kind === 'missing')) legend.push({ kind: 'missing', label: messages.legend.missing })
        return <ChartSurface {...common} definition={definition} legend={legend} exactValues={exactValues(
          ['Date', 'Value'], data.map((datum) => exactRow(datum.id, datum.date, datum.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface VerticalBarDatum {
  readonly id: string
  readonly category: string
  readonly value: number
}

export interface HorizontalBarDatum {
  readonly id: string
  readonly category: string
  readonly value: number
}

export interface SeriesBarDatum {
  readonly id: string
  readonly category: string
  readonly value: number
  readonly series: string
}

interface BarLabels {
  readonly categoryLabel?: string
  readonly valueLabel?: string
}

interface HorizontalBarLabels extends BarLabels {
  readonly valueLabelPlacement?: 'outside-end'
}

interface BarLabelsWithoutValues extends BarLabels {
  readonly valueLabelPlacement?: never
}

export interface BarAppearance {
  readonly cornerRadius?: number
}

interface BarAppearanceProps {
  readonly appearance?: BarAppearance
}

export type BarChartProps =
  | (CommonChartProps & BarLabelsWithoutValues & BarAppearanceProps & {
      readonly orientation: 'vertical'
      readonly layout: 'single'
      readonly state: ChartDataState<VerticalBarDatum>
    })
  | (CommonChartProps & HorizontalBarLabels & BarAppearanceProps & {
      readonly orientation: 'horizontal'
      readonly layout: 'single'
      readonly state: ChartDataState<HorizontalBarDatum>
    })
  | (CommonChartProps & BarLabelsWithoutValues & BarAppearanceProps & {
      readonly orientation: 'vertical'
      readonly layout: 'grouped' | 'stacked'
      readonly state: ChartDataState<SeriesBarDatum>
      readonly seriesOrder: readonly [string, ...string[]]
    })
  | (CommonChartProps & BarLabelsWithoutValues & BarAppearanceProps & {
      readonly orientation: 'horizontal'
      readonly layout: 'grouped' | 'stacked'
      readonly state: ChartDataState<SeriesBarDatum>
      readonly seriesOrder: readonly [string, ...string[]]
    })

interface BarRow {
  readonly id: string
  readonly category: string
  readonly value: number
  readonly series: string
}

function barRows(data: readonly (VerticalBarDatum | HorizontalBarDatum | SeriesBarDatum)[], message: string): BarRow[] {
  return data.map((datum) => ({
    id: datum.id,
    category: datum.category,
    value: finite(datum.value, message),
    series: 'series' in datum ? datum.series : 'Value',
  }))
}

export function BarChart(props: BarChartProps) {
  const { messages } = useChartConfiguration()
  const { state, orientation, layout, categoryLabel, valueLabel, valueLabelPlacement, appearance, ...rest } = props
  const { seriesOrder, ...common } = 'seriesOrder' in rest ? rest : { ...rest, seriesOrder: ['Value'] as const }
  const formatters = useChartFormatters(common.formatters)
  const cornerRadius = appearance?.cornerRadius ?? 0
  if (cornerRadius < 0 || !Number.isFinite(cornerRadius)) {
    throw new RangeError('Bar corner radius must be a nonnegative finite number.')
  }
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = barRows(data, messages.errors.invalidNumber)
        if (layout !== 'single') {
          const actualSeries = new Set(rows.map((row) => row.series))
          if (actualSeries.size !== seriesOrder.length || seriesOrder.some((series) => !actualSeries.has(series))) {
            throw new RangeError('BarChart seriesOrder must contain each data series exactly once.')
          }
        }
        const exact = exactValues(['Category', 'Series', 'Value'], rows.map((row) => exactRow(row.id, row.category, row.series, row.value)))
        const legend = seriesLegend(layout === 'single' ? ['Value'] : seriesOrder)
        const barLayout = layout === 'grouped' ? group({ padding: 0.12 }) : layout === 'stacked' ? stack({ order: seriesOrder }) : undefined
        if (orientation === 'vertical') {
          const definition = defineChart({
            marks: [barY(rows, { x: 'category', y: 'value', z: 'series', color: 'series', key: 'id', inset: 2, radius: cornerRadius, layout: barLayout })],
            x: { scale: () => scaleBand<string>().padding(0.12), axis: categoryLabel ? { label: categoryLabel } : undefined },
            y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
            color: { domain: layout === 'single' ? ['Value'] : seriesOrder, range: chartColors },
            tooltip: localizedTooltip(common.tooltip, formatters),
          })
          return <ChartSurface {...common} definition={definition} exactValues={exact} legend={legend} />
        }
        const marks = [
          barX(rows, { x: 'value', y: 'category', z: 'series', color: 'series', key: 'id', inset: 2, radius: cornerRadius, layout: barLayout }),
          ...(valueLabelPlacement === 'outside-end'
            ? [text(rows, {
                x: 'value', y: 'category', text: (row) => formatters.number(row.value), key: 'id',
                fill: 'var(--aperture-color-text)', anchor: (row) => row.value < 0 ? 'end' : 'start',
                dx: (row) => row.value < 0 ? -8 : 8, fontSize: 12, fontWeight: 650,
              })]
            : []),
        ]
        const definition = defineChart({
          marks,
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          y: { scale: () => scaleBand<string>().padding(0.12), axis: categoryLabel ? { label: categoryLabel } : undefined },
          color: { domain: layout === 'single' ? ['Value'] : seriesOrder, range: chartColors },
          tooltip: localizedHorizontalTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exact} legend={valueLabelPlacement === 'outside-end' ? [] : legend} />
      }}
    </ChartStateBoundary>
  )
}

export interface ScatterDatum {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly series?: string
  readonly radius?: number
}

export interface ScatterChartProps extends CommonChartProps, CrosshairChartProps {
  readonly state: ChartDataState<ScatterDatum>
  readonly xLabel?: string
  readonly yLabel?: string
}

export function ScatterChart({ state, xLabel, yLabel, ...common }: ScatterChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({
          ...datum,
          x: finite(datum.x, messages.errors.invalidNumber),
          y: finite(datum.y, messages.errors.invalidNumber),
          radius: datum.radius === undefined ? 4.5 : positiveRadius(datum.radius, 'ScatterChart'),
          series: datum.series ?? 'Value',
        }))
        const definition = defineChart({
          marks: [
            dot(rows, { x: 'x', y: 'y', r: 'radius', color: 'series', key: 'id', fillOpacity: 0.75 }),
            ...(common.crosshair ? [crosshairMark({ marker: true })] : []),
          ],
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(xLabel, formatters) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
          color: { range: chartColors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Series', xLabel ?? 'X', yLabel ?? 'Y', 'Radius'],
          rows.map((row) => exactRow(row.id, row.series, row.x, row.y, row.radius)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface HistogramBinDatum {
  readonly id: string
  readonly start: number
  readonly end: number
  readonly count: number
}

export interface HistogramChartProps extends CommonChartProps {
  readonly state: ChartDataState<HistogramBinDatum>
  readonly valueLabel?: string
  readonly countLabel?: string
}

export function HistogramChart({ state, valueLabel, countLabel, ...common }: HistogramChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => {
          validHistogramBin(datum.start, datum.end, datum.count)
          return datum
        })
        const definition = defineChart({
          marks: [rect(rows, { x1: 'start', x2: 'end', y1: () => 0, y2: 'count', key: 'id', inset: 1, fill: 'var(--aperture-chart-1)' })],
          x: { scale: scaleLinear, axis: numberAxis(valueLabel, formatters) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(countLabel, formatters) },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Bin start', 'Bin end', 'Count'], rows.map((row) => exactRow(row.id, row.start, row.end, row.count)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface HeatmapDatum {
  readonly id: string
  readonly x: string
  readonly y: string
  readonly value: number
}

export interface HeatmapChartProps extends CommonChartProps {
  readonly state: ChartDataState<HeatmapDatum>
  readonly xLabel?: string
  readonly yLabel?: string
  readonly colorDomain: readonly [number, number]
}

export function HeatmapChart({ state, xLabel, yLabel, colorDomain, ...common }: HeatmapChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  increasingDomain(colorDomain, 'Heatmap color')
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        const definition = defineChart({
          marks: [cell(rows, { x: 'x', y: 'y', color: 'value', key: 'id', inset: 1 })],
          x: { scale: () => scaleBand<string>().padding(0.02), axis: xLabel ? { label: xLabel } : undefined },
          y: { scale: () => scaleBand<string>().padding(0.02), axis: yLabel ? { label: yLabel } : undefined },
          color: { scale: () => scaleLinearColor<string>().domain(colorDomain).range(['var(--aperture-color-accent-soft)', 'var(--aperture-chart-1)']) },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          [xLabel ?? 'X', yLabel ?? 'Y', 'Value'], rows.map((row) => exactRow(row.id, row.x, row.y, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface RangeDatum {
  readonly id: string
  readonly date: Date
  readonly low: number
  readonly high: number
  readonly series?: string
}

export interface RangeChartProps extends CommonChartProps {
  readonly state: ChartDataState<RangeDatum>
  readonly xLabel?: string
  readonly yLabel?: string
  readonly timeAxis?: TimeAxisOptions
}

export function RangeChart({ state, xLabel, yLabel, timeAxis, ...common }: RangeChartProps) {
  const { messages, locale, timeZone } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => {
          validRange(datum.low, datum.high, 'RangeChart')
          return { ...datum, date: validDate(datum.date, messages.errors.invalidDate), series: datum.series ?? 'Range' }
        })
        const marks = [
          link(rows, { x1: 'date', y1: 'low', x2: 'date', y2: 'high', color: 'series', key: 'id', strokeWidth: 4 }),
          tickY(rows, { x: 'date', y: 'low', color: 'series', key: (row) => `${row.id}-low`, strokeWidth: 2 }),
          tickY(rows, { x: 'date', y: 'high', color: 'series', key: (row) => `${row.id}-high`, strokeWidth: 2 }),
        ]
        const dates = rows.map((row) => row.date)
        const definition = defineChart({
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
          chart: ({ width }) => {
            return {
              marks,
              x: timeXAxis(dates, width, locale, timeZone, timeAxis, xLabel, common.formatters?.date),
              y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
              color: { range: chartColors },
            }
          },
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Date', 'Series', 'Low', 'High'], rows.map((row) => exactRow(row.id, row.date, row.series, row.low, row.high)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface ErrorBarDatum {
  readonly id: string
  readonly category: string
  readonly estimate: number
  readonly low: number
  readonly high: number
}

export interface ErrorBarChartProps extends CommonChartProps {
  readonly state: ChartDataState<ErrorBarDatum>
  readonly categoryLabel?: string
  readonly valueLabel?: string
}

export function ErrorBarChart({ state, categoryLabel, valueLabel, ...common }: ErrorBarChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => {
          validErrorInterval(datum.low, datum.estimate, datum.high)
          return datum
        })
        const definition = defineChart({
          marks: [
            link(rows, { x1: 'category', y1: 'low', x2: 'category', y2: 'high', key: 'id', stroke: 'var(--aperture-chart-1)', strokeWidth: 1.5 }),
            tickY(rows, { x: 'category', y: 'low', key: 'id', stroke: 'var(--aperture-chart-1)', strokeWidth: 1.5 }),
            tickY(rows, { x: 'category', y: 'high', key: 'id', stroke: 'var(--aperture-chart-1)', strokeWidth: 1.5 }),
            dot(rows, { x: 'category', y: 'estimate', key: 'id', fill: 'var(--aperture-chart-1)', r: 4 }),
          ],
          x: { scale: () => scaleBand<string>().padding(0.3), axis: categoryLabel ? { label: categoryLabel } : undefined },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Category', 'Estimate', 'Low', 'High'], rows.map((row) => exactRow(row.id, row.category, row.estimate, row.low, row.high)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface StackedAreaDatum {
  readonly id: string
  readonly date: Date
  readonly value: number
  readonly series: string
}

export interface StackedAreaChartProps extends CommonChartProps, CrosshairChartProps {
  readonly state: ChartDataState<StackedAreaDatum>
  readonly seriesOrder: readonly string[]
  readonly xLabel?: string
  readonly yLabel?: string
  readonly normalization?: 'none' | 'percent'
  readonly timeAxis?: TimeAxisOptions
  readonly interpolation?: CartesianInterpolation
  readonly appearance?: AreaAppearance
}

export interface BrushableStackedAreaChartProps extends StackedAreaChartProps {
  readonly brush: DateBrush
}

function StackedAreaPlot({
  state,
  seriesOrder,
  xLabel,
  yLabel,
  normalization = 'none',
  timeAxis,
  interpolation = 'linear',
  appearance,
  brush,
  ...common
}: StackedAreaChartProps & { readonly brush?: DateBrush }) {
  const { messages, locale, timeZone } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  const gradientIdPrefix = `aperture-area-${useId().replaceAll(':', '')}`
  if (interpolation !== 'linear' && interpolation !== 'monotone-x') {
    throw new RangeError('Cartesian interpolation must be linear or monotone-x.')
  }
  seriesLegend(seriesOrder)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, date: validDate(datum.date, messages.errors.invalidDate), value: finite(datum.value, messages.errors.invalidNumber) }))
        const dates = rows.map((row) => row.date)
        const observations = uniqueDateValues(dates)
        const oneObservation = observations.length === 1
        const curve = interpolation === 'monotone-x' ? monotoneXCurve : undefined
        const paint = areaPaint(seriesOrder, appearance, 0.78, gradientIdPrefix)
        const marks = [
          oneObservation ? dot(rows, { x: 'date', y: 'value', color: 'series', key: 'id', r: 4.5 }) : areaY(rows, {
            x: 'date', y: 'value', z: 'series', color: 'series', key: 'id', fill: paint.fill,
            fillOpacity: paint.fillOpacity, stroke: paint.stroke, strokeWidth: paint.strokeWidth,
            curve,
            layout: stack({ order: seriesOrder, ...(normalization === 'percent' ? { offset: 'normalize' as const } : {}) }),
          }),
          ruleY([0]),
          ...(common.crosshair ? [crosshairMark({ x: true, y: false })] : []),
        ]
        let controls
        if (brush !== undefined) {
          const start = validDate(brush.value.start, messages.errors.invalidDate)
          const end = validDate(brush.value.end, messages.errors.invalidDate)
          const brushValues = timeAxis?.position === 'observations'
            ? observations
            : [...observations].sort((left, right) => left.getTime() - right.getTime())
          const startIndex = brushValues.findIndex((date) => date.getTime() === start.getTime())
          const endIndex = brushValues.findIndex((date) => date.getTime() === end.getTime())
          if (startIndex === -1 || endIndex === -1) {
            throw new RangeError('Brush range endpoints must match chart observations.')
          }
          if (startIndex > endIndex) throw new RangeError('Brush ranges must follow the chart position order.')
          controls = [brushX({
            range: controlledSignal<DateRange, BrushXChange<Date>>(
              { start, end },
              (next, { reason }) => {
                if (reason.type === 'commit') brush.onChange(next)
              },
            ),
            values: brushValues,
            keyboard: true,
            format: timeAxis?.format ?? formatters.date,
            ariaLabel: brush.ariaLabel,
            startAriaLabel: brush.startAriaLabel,
            endAriaLabel: brush.endAriaLabel,
            ...(brush.appearance === 'low-emphasis'
              ? {
                  selectionStyle: { fillOpacity: 0.12, strokeOpacity: 0.35, strokeWidth: 1 },
                  handleStyle: { opacity: 0 },
                }
              : {}),
          })]
        }
        const definition = defineChart({
          focus: 'group-x',
          tooltip: localizedTooltip(common.tooltip, formatters, undefined, true),
          controls,
          chart: ({ width }) => {
            return {
              marks,
              gradients: paint.gradients,
              x: timeXAxis(dates, width, locale, timeZone, timeAxis, xLabel, common.formatters?.date),
              y: { scale: scaleLinear, grid: true, axis: numberAxis(yLabel, formatters) },
              color: { domain: seriesOrder, range: chartColors },
            }
          },
        })
        const surfaceClassName = brush?.appearance === 'low-emphasis'
          ? [common.className, 'aperture-brush-low-emphasis'].filter(Boolean).join(' ')
          : common.className
        return <ChartSurface {...common} className={surfaceClassName} definition={definition} legend={seriesLegend(seriesOrder)} exactValues={exactValues(
          ['Date', 'Series', 'Value'], rows.map((row) => exactRow(row.id, row.date, row.series, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export function StackedAreaChart(props: StackedAreaChartProps) {
  return <StackedAreaPlot {...props} />
}

export function BrushableStackedAreaChart({ brush, ...props }: BrushableStackedAreaChartProps) {
  return <StackedAreaPlot {...props} brush={brush} />
}

export interface FacetDatum {
  readonly id: string
  readonly facet: string
  readonly x: number
  readonly y: number
  readonly series?: string
}

export interface FacetChartProps extends CommonChartProps {
  readonly state: ChartDataState<FacetDatum>
  readonly columns?: number
  readonly xLabel?: string
  readonly yLabel?: string
}

export function FacetChart({ state, columns = 2, xLabel, yLabel, ...common }: FacetChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, x: finite(datum.x, messages.errors.invalidNumber), y: finite(datum.y, messages.errors.invalidNumber), series: datum.series ?? 'Value' }))
        const xValues = rows.map((row) => row.x)
        const yValues = rows.map((row) => row.y)
        const xDomain = [Math.min(...xValues), Math.max(...xValues)] as const
        const yDomain = [Math.min(...yValues), Math.max(...yValues)] as const
        const definition = facetChart(rows, {
          by: 'facet',
          columns,
          label: true,
          axes: 'outer',
          chart: (facetRows) => defineChart({
            marks: [dot(facetRows, { x: 'x', y: 'y', color: 'series', key: 'id' })],
            x: { scale: scaleLinear().domain(xDomain), nice: true, axis: numberAxis(xLabel, formatters) },
            y: { scale: scaleLinear().domain(yDomain), nice: true, axis: numberAxis(yLabel, formatters) },
            color: { range: chartColors },
          }),
        })
        const interactive = defineChart(definition, { tooltip: localizedTooltip(common.tooltip, formatters) })
        return <ChartSurface {...common} definition={interactive} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Facet', 'Series', xLabel ?? 'X', yLabel ?? 'Y'], rows.map((row) => exactRow(row.id, row.facet, row.series, row.x, row.y)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface WaterfallDatum {
  readonly id: string
  readonly label: string
  readonly delta: number
}

export interface WaterfallChartProps extends CommonChartProps {
  readonly state: ChartDataState<WaterfallDatum>
  readonly includeTotal?: boolean
  readonly valueLabel?: string
}

export function WaterfallChart({ state, includeTotal = true, valueLabel, ...common }: WaterfallChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const source = data.map((datum) => ({ ...datum, delta: finite(datum.delta, messages.errors.invalidNumber) }))
        const rows = waterfall(source, { value: 'delta', total: includeTotal })
        const definition = defineChart({
          marks: [barY(rows, { x: (row) => row.kind === 'total' ? 'Total' : row.label, y1: 'start', y2: 'end', color: 'kind', inset: 2 })],
          x: { scale: () => scaleBand<string>().padding(0.12) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          color: { domain: ['increase', 'decrease', 'total'], range: ['var(--aperture-chart-2)', 'var(--aperture-color-danger)', 'var(--aperture-chart-1)'] },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Step', 'Change'], source.map((row) => exactRow(row.id, row.label, row.delta)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface CandlestickDatum {
  readonly id: string
  readonly date: Date
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
}

export interface CandlestickChartProps extends CommonChartProps {
  readonly state: ChartDataState<CandlestickDatum>
  readonly candleInterval: CalendarTickInterval
  readonly priceLabel?: string
  readonly timeAxis?: ElapsedTimeAxisOptions
}

export function CandlestickChart({ state, candleInterval, priceLabel, timeAxis, ...common }: CandlestickChartProps) {
  const { messages, locale, timeZone } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  if (timeAxis !== undefined && timeAxis.position !== 'elapsed') {
    throw new RangeError('Candlestick time-axis positions must be elapsed.')
  }
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const source = data.map((datum) => {
          validCandlestick(datum.low, datum.open, datum.close, datum.high)
          return { ...datum, date: validDate(datum.date, messages.errors.invalidDate), direction: datum.close >= datum.open ? 'increase' : 'decrease' }
        })
        const timestamps = [...source.map((row) => row.date.getTime())].sort((left, right) => left - right)
        for (let index = 1; index < timestamps.length; index += 1) {
          if (timestamps[index] === timestamps[index - 1]) throw new RangeError('Candlestick dates must be unique.')
        }
        const sortedSource = [...source].sort((left, right) => left.date.getTime() - right.date.getTime())
        const intervalBounds = new Map(sortedSource.map((row) => {
          const timestamp = row.date.getTime()
          const [calendarPrevious, calendarNext] = timeIntervalNeighbors(row.date, candleInterval, timeZone)
          const previousGap = timestamp - calendarPrevious.getTime()
          const nextGap = calendarNext.getTime() - timestamp
          const period = Math.min(previousGap, nextGap)
          if (period < 4) throw new RangeError('Candlestick intervals must span at least 4 milliseconds.')
          const halfWidth = Math.max(1, Math.floor(period * 0.32))
          return [timestamp, {
            bodyStart: new Date(timestamp - halfWidth),
            bodyEnd: new Date(timestamp + halfWidth),
            periodStart: new Date(timestamp - Math.floor(period / 2)),
            periodEnd: new Date(timestamp + Math.ceil(period / 2)),
          }] as const
        }))
        const rows = source.map((row) => {
          const bounds = intervalBounds.get(row.date.getTime())!
          return { ...row, ...bounds }
        })
        const rowsByDate = [...rows].sort((left, right) => left.date.getTime() - right.date.getTime())
        for (let index = 1; index < rowsByDate.length; index += 1) {
          if (rowsByDate[index - 1]!.periodEnd.getTime() > rowsByDate[index]!.periodStart.getTime()) {
            throw new RangeError('Candlestick observations are too close for the declared candle interval.')
          }
        }
        const dates = rows.map((row) => row.date)
        let domainStart = Number.POSITIVE_INFINITY
        let domainEnd = Number.NEGATIVE_INFINITY
        for (const row of rows) {
          domainStart = Math.min(domainStart, row.bodyStart.getTime())
          domainEnd = Math.max(domainEnd, row.bodyEnd.getTime())
        }
        const domain = [new Date(domainStart), new Date(domainEnd)] as const
        const marks = [
          link(rows, { x1: 'date', y1: 'low', x2: 'date', y2: 'high', key: 'id', stroke: 'var(--aperture-color-text)' }),
          rect(rows, { x: 'date', x1: 'bodyStart', x2: 'bodyEnd', y1: 'open', y2: 'close', color: 'direction', key: 'id', inset: 1, stroke: 'var(--aperture-color-text)', strokeWidth: 1 }),
        ]
        const definition = defineChart({
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
          chart: ({ width }) => {
            const time = planTimeAxis({ dates, domain, width, locale, timeZone, options: timeAxis?.ticks })
            const dateFormat = timeAxis?.format ?? common.formatters?.date
            const axis = dateFormat === undefined
              ? time.axis
              : { ...time.axis, ticks: { ...time.axis.ticks, format: dateFormat } }
            return {
              marks,
              x: { scale: scaleUtc().domain(time.domain), axis },
              y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(priceLabel, formatters) },
              color: { domain: ['increase', 'decrease'], range: ['var(--aperture-chart-2)', 'var(--aperture-color-danger)'] },
            }
          },
        })
        return <ChartSurface {...common} definition={definition} legend={[
          { label: 'Increase' }, { label: 'Decrease' },
        ]} exactValues={exactValues(
          ['Date', 'Open', 'High', 'Low', 'Close'], rows.map((row) => exactRow(row.id, row.date, row.open, row.high, row.low, row.close)),
        )} />
      }}
    </ChartStateBoundary>
  )
}
