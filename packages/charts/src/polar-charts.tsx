import { defineChart } from '@tanstack/charts'
import { sunburst } from '@tanstack/charts/hierarchy/sunburst'
import {
  angleGrid,
  pie,
  polar,
  radialArc,
  radialArea,
  radialDot,
  radialGrid,
  radialLine,
  radialText,
} from '@tanstack/charts/polar'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { exactRow, exactValues, seriesLegend } from './exact-values'
import { localizedTooltip, useChartFormatters } from './formatting'
import { useChartConfiguration } from './provider'
import { ChartStateBoundary, ChartSurface, SingletonChartStateBoundary } from './surface'
import type { ChartDataState, CommonChartProps, SingletonChartDataState } from './types'
import { bounded, finite, increasingDomain, validDonutValues } from './validation'

const colors = [
  'var(--aperture-chart-1)',
  'var(--aperture-chart-2)',
  'var(--aperture-chart-3)',
  'var(--aperture-chart-4)',
  'var(--aperture-chart-5)',
] as const
const seriesDasharrays = ['', '8 3', '2 3', '10 3 2 3', '1 3'] as const

export interface DonutDatum {
  readonly id: string
  readonly label: string
  readonly value: number
}

export interface DonutChartProps extends CommonChartProps {
  readonly state: ChartDataState<DonutDatum>
  readonly innerRadiusRatio?: number
}

export function DonutChart({ state, innerRadiusRatio = 0.58, ...common }: DonutChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  bounded(innerRadiusRatio, 0, 0.9, messages.errors.invalidNumber)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        validDonutValues(rows.map((row) => row.value))
        const slices = pie(rows, { value: 'value' })
        const definition = defineChart({
          marks: [polar({
            inset: 8,
            radiusRatio: 0.84,
            marks: [radialArc(slices, {
              innerRadius: ({ radius }) => radius * innerRadiusRatio,
              cornerRadius: 3,
              color: 'id',
              key: 'id',
            })],
          })],
          color: { domain: rows.map((row) => row.id), range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.label))} exactValues={exactValues(
          ['Segment', 'Value'], rows.map((row) => exactRow(row.id, row.label, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface GaugeDatum {
  readonly value: number
  readonly minimum: number
  readonly maximum: number
  readonly label?: string
}

export interface GaugeChartProps extends CommonChartProps {
  readonly state: SingletonChartDataState<GaugeDatum>
}

export function GaugeChart({ state, ...common }: GaugeChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <SingletonChartStateBoundary state={state} rootProps={common}>
      {(source) => {
        const minimum = finite(source.minimum, messages.errors.invalidNumber)
        const maximum = finite(source.maximum, messages.errors.invalidNumber)
        if (maximum <= minimum) throw new RangeError('Gauge maximum must be greater than minimum.')
        const value = bounded(source.value, minimum, maximum, messages.errors.invalidNumber)
        const fraction = (value - minimum) / (maximum - minimum)
        const parts = [
          { id: 'value', value: fraction },
          { id: 'remaining', value: 1 - fraction },
        ]
        const slices = pie(parts, { value: 'value', startAngle: -Math.PI * 0.75, endAngle: Math.PI * 0.75 })
        const reading = [{ id: 'reading', text: formatters.number(value) }]
        const definition = defineChart({
          marks: [polar({
            radiusRatio: 0.84,
            angle: { scale: scaleLinear().domain([0, 1]) },
            radius: { scale: scaleLinear().domain([0, 1]) },
            marks: [
              radialArc(slices, { innerRadius: ({ radius }) => radius * 0.72, cornerRadius: 999, color: 'id', key: 'id' }),
              radialText(reading, { angle: 0, radius: 0, text: 'text', key: 'id', fill: 'currentColor', fontSize: 20, fontWeight: 700 }),
            ],
          })],
          color: { domain: ['value', 'remaining'], range: ['var(--aperture-chart-1)', 'var(--aperture-color-border)'] },
          tooltip: localizedTooltip(common.tooltip, formatters, `${source.label ?? 'Value'}: ${formatters.number(value)}`),
        })
        const label = source.label ?? 'Value'
        return <ChartSurface {...common} definition={definition} legend={[{ label, detail: formatters.number(value) }]} exactValues={exactValues(
          ['Label', 'Value', 'Minimum', 'Maximum'], [exactRow('gauge', label, value, minimum, maximum)],
        )} />
      }}
    </SingletonChartStateBoundary>
  )
}

export interface RadarDatum {
  readonly id: string
  readonly dimension: string
  readonly value: number
  readonly series?: string
}

export interface RadarChartProps extends CommonChartProps {
  readonly state: ChartDataState<RadarDatum>
  readonly dimensions: readonly [string, ...string[]]
  readonly domain?: readonly [number, number]
}

export function RadarChart({ state, dimensions, domain = [0, 1], ...common }: RadarChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  increasingDomain(domain, 'Radar')
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber), series: datum.series ?? 'Value' }))
        const series = [...new Set(rows.map((row) => row.series))]
        seriesLegend(series)
        const definition = defineChart({
          marks: [polar({
            radiusRatio: 0.72,
            angle: { scale: scalePoint<string>().domain(dimensions), wrap: true },
            radius: { scale: scaleLinear().domain(domain) },
            guides: [radialGrid({ ticks: 4, shape: 'polygon' }), angleGrid({ labels: true })],
            marks: [
              radialArea(rows, { angle: 'dimension', radius: 'value', z: 'series', color: 'series', key: 'id', fillOpacity: 0.18 }),
              ...series.map((name, index) => radialLine(rows.filter((row) => row.series === name), {
                angle: 'dimension', radius: 'value', color: 'series', key: 'id',
                strokeWidth: 2, strokeDasharray: seriesDasharrays[index],
              })),
              radialDot(rows, { angle: 'dimension', radius: 'value', color: 'series', key: 'id', r: 3.5 }),
            ],
          })],
          color: { domain: series, range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.series))} exactValues={exactValues(
          ['Dimension', 'Series', 'Value'], rows.map((row) => exactRow(row.id, row.dimension, row.series, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface HierarchyDatum {
  readonly id: string
  readonly parentId: string | null
  readonly label: string
  readonly value: number | null
}

export interface SunburstChartProps extends CommonChartProps {
  readonly state: ChartDataState<HierarchyDatum>
  readonly rootId?: string
  readonly visibleDepth?: number
}

export function SunburstChart({ state, rootId, visibleDepth, ...common }: SunburstChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: datum.value === null ? null : finite(datum.value, messages.errors.invalidNumber) }))
        const definition = defineChart({
          marks: [polar({
            radiusRatio: 0.86,
            marks: [sunburst(rows, {
              nodeId: 'id', parentId: 'parentId', value: 'value',
              ...(rootId === undefined ? {} : { rootId }),
              ...(visibleDepth === undefined ? {} : { visibleDepth }),
              color: 'branchId', stroke: 'var(--aperture-color-background)', strokeWidth: 1, ringPadding: 1,
            })],
          })],
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Node', 'Parent', 'Value'], rows.map((row) => exactRow(row.id, row.label, row.parentId, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}
