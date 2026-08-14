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
  tickY,
  waterfall,
} from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { scaleLinear as scaleLinearColor, scaleUtc } from 'd3-scale'
import { exactRow, exactValues, lineSeriesDasharrays, pointSeriesStyles, seriesLegend, type SemanticLegendItem } from './exact-values.js'
import { dateAxis, localizedTooltip, numberAxis, useChartFormatters } from './formatting.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, ChartSurface } from './surface.js'
import type { ChartDataState, CommonChartProps, CrosshairChartProps, NumericPoint } from './types.js'
import { finite, increasingDomain, numericPoint, positiveRadius, validCandlestick, validDate, validErrorInterval, validHistogramBin, validRange } from './validation.js'

const chartColors = [
  'var(--aperture-chart-1)',
  'var(--aperture-chart-2)',
  'var(--aperture-chart-3)',
  'var(--aperture-chart-4)',
  'var(--aperture-chart-5)',
] as const

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

export function LineChart({ state, xLabel, yLabel, showPoints = true, reference, ...common }: LineChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  const referenceValue = reference === undefined ? undefined : finite(reference.value, 'LineChart reference value must be finite.')
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = timeRows(data, messages.errors.invalidDate, messages.errors.invalidNumber)
        const series = [...new Set(rows.map((row) => row.series))]
        seriesLegend(series)
        const rowsBySeries = new Map(series.map((name) => [name, [] as TimeSeriesRow[]]))
        for (const row of rows) rowsBySeries.get(row.series)!.push(row)
        const dates = [...new Set(rows.map((row) => row.date.getTime()))].sort((left, right) => left - right)
        const oneDate = dates.length === 1
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
        const firstDate = new Date(dates[0]!)
        const lastDate = new Date(dates[dates.length - 1]!)
        const definition = defineChart({
          marks: [
            ...lineMarks,
            ...(referenceValue === undefined ? [] : [ruleY([referenceValue], { stroke: 'var(--aperture-color-text)', strokeDasharray: '6 4', strokeWidth: 1.5 })]),
            ...(common.crosshair ? [crosshairMark({ x: true, y: false, marker: true })] : []),
          ],
          x: {
            scale: oneDate
              ? () => scaleBand<Date>().domain([firstDate]).padding(0.5)
              : () => scaleUtc().domain([firstDate, lastDate]),
            axis: dateAxis(xLabel, formatters, rows.map((row) => row.date)),
          },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
          color: { domain: series, range: chartColors },
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
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
}

export function AreaChart({ state, xLabel, yLabel, ...common }: AreaChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = timeRows(data, messages.errors.invalidDate, messages.errors.invalidNumber)
        const oneObservation = new Set(rows.map((row) => row.date.getTime())).size === 1
        const definition = defineChart({
          marks: [
            oneObservation
              ? dot(rows.filter((row) => row.value !== null), { x: 'date', y: 'value', key: 'id', r: 4.5, fill: 'var(--aperture-chart-1)' })
              : areaY(rows, { x: 'date', y1: () => 0, y2: 'value', key: 'id', fill: 'var(--aperture-chart-1)', fillOpacity: 0.32, strokeWidth: 2 }),
            ...(common.crosshair ? [crosshairMark({ x: true, y: false })] : []),
          ],
          x: { scale: scaleUtc, axis: dateAxis(xLabel, formatters, rows.map((row) => row.date)) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
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

export type BarChartProps =
  | (CommonChartProps & BarLabels & {
      readonly orientation: 'vertical'
      readonly layout: 'single'
      readonly state: ChartDataState<VerticalBarDatum>
    })
  | (CommonChartProps & BarLabels & {
      readonly orientation: 'horizontal'
      readonly layout: 'single'
      readonly state: ChartDataState<HorizontalBarDatum>
    })
  | (CommonChartProps & BarLabels & {
      readonly orientation: 'vertical' | 'horizontal'
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
  const formatters = useChartFormatters()
  const { state, orientation, layout, categoryLabel, valueLabel, ...rest } = props
  const { seriesOrder, ...common } = 'seriesOrder' in rest ? rest : { ...rest, seriesOrder: ['Value'] as const }
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
            marks: [barY(rows, { x: 'category', y: 'value', z: 'series', color: 'series', key: 'id', inset: 2, layout: barLayout })],
            x: { scale: () => scaleBand<string>().padding(0.12), axis: categoryLabel ? { label: categoryLabel } : undefined },
            y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
            color: { domain: layout === 'single' ? ['Value'] : seriesOrder, range: chartColors },
            tooltip: localizedTooltip(common.tooltip, formatters),
          })
          return <ChartSurface {...common} definition={definition} exactValues={exact} legend={legend} />
        }
        const definition = defineChart({
          marks: [barX(rows, { x: 'value', y: 'category', z: 'series', color: 'series', key: 'id', inset: 2, layout: barLayout })],
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          y: { scale: () => scaleBand<string>().padding(0.12), axis: categoryLabel ? { label: categoryLabel } : undefined },
          color: { domain: layout === 'single' ? ['Value'] : seriesOrder, range: chartColors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exact} legend={legend} />
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
  const formatters = useChartFormatters()
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
  const formatters = useChartFormatters()
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
  const formatters = useChartFormatters()
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
}

export function RangeChart({ state, xLabel, yLabel, ...common }: RangeChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => {
          validRange(datum.low, datum.high, 'RangeChart')
          return { ...datum, date: validDate(datum.date, messages.errors.invalidDate), series: datum.series ?? 'Range' }
        })
        const definition = defineChart({
          marks: [
            link(rows, { x1: 'date', y1: 'low', x2: 'date', y2: 'high', color: 'series', key: 'id', strokeWidth: 4 }),
            tickY(rows, { x: 'date', y: 'low', color: 'series', key: (row) => `${row.id}-low`, strokeWidth: 2 }),
            tickY(rows, { x: 'date', y: 'high', color: 'series', key: (row) => `${row.id}-high`, strokeWidth: 2 }),
          ],
          x: { scale: scaleUtc, axis: dateAxis(xLabel, formatters, rows.map((row) => row.date)) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
          color: { range: chartColors },
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
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
  const formatters = useChartFormatters()
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

export interface StackedAreaChartProps extends CommonChartProps {
  readonly state: ChartDataState<StackedAreaDatum>
  readonly seriesOrder: readonly string[]
  readonly xLabel?: string
  readonly yLabel?: string
  readonly normalization?: 'none' | 'percent'
}

export function StackedAreaChart({ state, seriesOrder, xLabel, yLabel, normalization = 'none', ...common }: StackedAreaChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  seriesLegend(seriesOrder)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, date: validDate(datum.date, messages.errors.invalidDate), value: finite(datum.value, messages.errors.invalidNumber) }))
        const oneObservation = new Set(rows.map((row) => row.date.getTime())).size === 1
        const definition = defineChart({
          marks: [
            oneObservation ? dot(rows, { x: 'date', y: 'value', color: 'series', key: 'id', r: 4.5 }) : areaY(rows, {
              x: 'date', y: 'value', z: 'series', color: 'series', key: 'id', fillOpacity: 0.78,
              layout: stack({ order: seriesOrder, ...(normalization === 'percent' ? { offset: 'normalize' as const } : {}) }),
            }),
            ruleY([0]),
          ],
          x: { scale: scaleUtc, axis: dateAxis(xLabel, formatters, rows.map((row) => row.date)) },
          y: { scale: scaleLinear, grid: true, axis: numberAxis(yLabel, formatters) },
          color: { domain: seriesOrder, range: chartColors },
          focus: 'group-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(seriesOrder)} exactValues={exactValues(
          ['Date', 'Series', 'Value'], rows.map((row) => exactRow(row.id, row.date, row.series, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
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
  const formatters = useChartFormatters()
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
  const formatters = useChartFormatters()
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
  readonly priceLabel?: string
}

export function CandlestickChart({ state, priceLabel, ...common }: CandlestickChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => {
          validCandlestick(datum.low, datum.open, datum.close, datum.high)
          return { ...datum, date: validDate(datum.date, messages.errors.invalidDate), direction: datum.close >= datum.open ? 'increase' : 'decrease' }
        })
        const definition = defineChart({
          marks: [
            link(rows, { x1: 'date', y1: 'low', x2: 'date', y2: 'high', key: 'id', stroke: 'var(--aperture-color-text)' }),
            rect(rows, { x: 'date', y1: 'open', y2: 'close', color: 'direction', key: 'id', inset: 3, stroke: 'var(--aperture-color-text)', strokeWidth: 1 }),
          ],
          x: { scale: () => scaleBand<Date>().padding(0.2), axis: dateAxis(undefined, formatters, rows.map((row) => row.date)) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(priceLabel, formatters) },
          color: { domain: ['increase', 'decrease'], range: ['var(--aperture-chart-2)', 'var(--aperture-color-danger)'] },
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
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
