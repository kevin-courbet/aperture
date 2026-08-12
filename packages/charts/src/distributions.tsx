import {
  boxY,
  defineChart,
  dodgeY,
  dot,
  lineY,
  ridgelineY,
  violinY,
} from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { densityContour } from '@tanstack/charts/spatial/density'
import { exactRow, exactValues, seriesLegend } from './exact-values'
import { localizedTooltip, numberAxis, useChartFormatters } from './formatting'
import { useChartConfiguration } from './provider'
import { ChartStateBoundary, ChartSurface } from './surface'
import type { ChartDataState, CommonChartProps } from './types'
import { bounded, finite } from './validation'

const colors = [
  'var(--aperture-chart-1)',
  'var(--aperture-chart-2)',
  'var(--aperture-chart-3)',
  'var(--aperture-chart-4)',
  'var(--aperture-chart-5)',
] as const
const seriesDasharrays = ['', '8 3', '2 3', '10 3 2 3', '1 3'] as const

export interface BoxPlotDatum {
  readonly id: string
  readonly category: string
  readonly value: number
}

export interface BoxPlotChartProps extends CommonChartProps {
  readonly state: ChartDataState<BoxPlotDatum>
  readonly categoryLabel?: string
  readonly valueLabel?: string
}

export function BoxPlotChart({ state, categoryLabel, valueLabel, ...common }: BoxPlotChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        const definition = defineChart({
          marks: [boxY(rows, { x: 'category', y: 'value', key: 'id', fill: 'var(--aperture-color-accent-soft)', stroke: 'var(--aperture-chart-1)' })],
          x: { scale: () => scaleBand<string>().padding(0.24), axis: categoryLabel ? { label: categoryLabel } : undefined },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Category', 'Value'], rows.map((row) => exactRow(row.id, row.category, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface DistributionProfileDatum {
  readonly id: string
  readonly category: string
  readonly position: number
  readonly density: number
}

export interface ViolinChartProps extends CommonChartProps {
  readonly state: ChartDataState<DistributionProfileDatum>
  readonly categoryLabel?: string
  readonly valueLabel?: string
}

export function ViolinChart({ state, categoryLabel, valueLabel, ...common }: ViolinChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({
          ...datum,
          position: finite(datum.position, messages.errors.invalidNumber),
          density: bounded(datum.density, 0, 1, messages.errors.invalidNumber),
        }))
        const definition = defineChart({
          marks: [violinY(rows, { x: 'category', y: 'position', width: 'density', color: 'category', key: 'id', fillOpacity: 0.56, stroke: 'var(--aperture-color-text)' })],
          x: { scale: () => scaleBand<string>().padding(0.2), axis: categoryLabel ? { label: categoryLabel } : undefined },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.category))} exactValues={exactValues(
          ['Category', 'Position', 'Density'], rows.map((row) => exactRow(row.id, row.category, row.position, row.density)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface RidgelineChartProps extends CommonChartProps {
  readonly state: ChartDataState<DistributionProfileDatum>
  readonly categoryLabel?: string
  readonly valueLabel?: string
  readonly overlap?: number
}

export function RidgelineChart({ state, categoryLabel, valueLabel, overlap = 0.75, ...common }: RidgelineChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  finite(overlap, messages.errors.invalidNumber)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({
          ...datum,
          position: finite(datum.position, messages.errors.invalidNumber),
          density: bounded(datum.density, 0, 1, messages.errors.invalidNumber),
        }))
        const definition = defineChart({
          marks: [ridgelineY(rows, { x: 'position', y: 'category', height: 'density', color: 'category', key: 'id', overlap, fillOpacity: 0.5, stroke: 'var(--aperture-color-text)' })],
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          y: { scale: () => scaleBand<string>().padding(0.1), axis: categoryLabel ? { label: categoryLabel } : undefined },
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.category))} exactValues={exactValues(
          ['Category', 'Position', 'Density'], rows.map((row) => exactRow(row.id, row.category, row.position, row.density)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface BeeswarmDatum {
  readonly id: string
  readonly value: number
  readonly category?: string
}

export interface BeeswarmChartProps extends CommonChartProps {
  readonly state: ChartDataState<BeeswarmDatum>
  readonly valueLabel?: string
}

export function BeeswarmChart({ state, valueLabel, ...common }: BeeswarmChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber), category: datum.category ?? 'Value' }))
        const definition = defineChart({
          marks: [dot(rows, { x: 'value', color: 'category', key: 'id', r: 4, layout: dodgeY({ anchor: 'middle', padding: 1 }), fillOpacity: 0.78 })],
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.category))} exactValues={exactValues(
          ['Category', 'Value'], rows.map((row) => exactRow(row.id, row.category, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface DensityDatum {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly series?: string
  readonly weight?: number
}

export interface DensityChartProps extends CommonChartProps {
  readonly state: ChartDataState<DensityDatum>
  readonly xLabel?: string
  readonly yLabel?: string
  readonly bandwidth?: number
  readonly thresholds?: number
}

export function DensityChart({ state, xLabel, yLabel, bandwidth = 20, thresholds = 12, ...common }: DensityChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  finite(bandwidth, messages.errors.invalidNumber)
  finite(thresholds, messages.errors.invalidNumber)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({
          ...datum,
          x: finite(datum.x, messages.errors.invalidNumber),
          y: finite(datum.y, messages.errors.invalidNumber),
          series: datum.series ?? 'Value',
          weight: datum.weight === undefined ? 1 : finite(datum.weight, messages.errors.invalidNumber),
        }))
        const definition = defineChart({
          marks: [
            densityContour(rows, {
              x: 'x', y: 'y', z: 'series', weight: 'weight', bandwidth, thresholds,
              color: 'group', fillOpacity: 0.22, stroke: 'var(--aperture-chart-1)', strokeWidth: 1,
            }),
            dot(rows, { x: 'x', y: 'y', color: 'series', key: 'id', r: 2.5, fillOpacity: 0.35 }),
          ],
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(xLabel, formatters) },
          y: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(yLabel, formatters) },
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Series', xLabel ?? 'X', yLabel ?? 'Y', 'Weight'], rows.map((row) => exactRow(row.id, row.series, row.x, row.y, row.weight)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface EcdfDatum {
  readonly id: string
  readonly value: number
  readonly proportion: number
  readonly series?: string
}

export interface EcdfChartProps extends CommonChartProps {
  readonly state: ChartDataState<EcdfDatum>
  readonly valueLabel?: string
  readonly proportionLabel?: string
}

export function EcdfChart({ state, valueLabel, proportionLabel, ...common }: EcdfChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({
          ...datum,
          value: finite(datum.value, messages.errors.invalidNumber),
          proportion: bounded(datum.proportion, 0, 1, messages.errors.invalidNumber),
          series: datum.series ?? 'Value',
        }))
        const lastBySeries = new Map<string, { value: number; proportion: number }>()
        for (const row of rows) {
          const previous = lastBySeries.get(row.series)
          if (previous && (row.value < previous.value || row.proportion < previous.proportion)) {
            throw new RangeError('ECDF values and cumulative proportions must not decrease within a series.')
          }
          lastBySeries.set(row.series, row)
        }
        const series = [...lastBySeries.keys()]
        seriesLegend(series)
        const definition = defineChart({
          marks: series.map((name, index) => lineY(rows.filter((row) => row.series === name), {
            x: 'value', y: 'proportion', color: 'series', key: 'id', points: true,
            strokeWidth: 2, strokeDasharray: seriesDasharrays[index],
          })),
          x: { scale: scaleLinear, nice: true, grid: true, axis: numberAxis(valueLabel, formatters) },
          y: { scale: scaleLinear().domain([0, 1]), grid: true, axis: numberAxis(proportionLabel, formatters) },
          color: { domain: series, range: colors },
          focus: 'nearest-x',
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Series', 'Value', 'Proportion'], rows.map((row) => exactRow(row.id, row.series, row.value, row.proportion)),
        )} />
      }}
    </ChartStateBoundary>
  )
}
