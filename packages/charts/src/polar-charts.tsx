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
  radialRule,
  radialText,
} from '@tanstack/charts/polar'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { exactRow, exactValues, seriesLegend } from './exact-values.js'
import { localizedTooltip, useChartFormatters } from './formatting.js'
import { chartColors } from './palette.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, ChartSurface, SingletonChartStateBoundary } from './surface.js'
import type { ChartDataState, CommonChartProps, SingletonChartDataState } from './types.js'
import { bounded, finite, increasingDomain, validDonutValues } from './validation.js'

const seriesDasharrays = ['', '8 3', '2 3', '10 3 2 3', '1 3', '12 4', '4 2 1 2', '2 2 8 2'] as const

export interface DonutDatum {
  readonly id: string
  readonly label: string
  readonly value: number
}

export interface DonutChartProps extends CommonChartProps {
  readonly state: ChartDataState<DonutDatum>
  readonly innerRadiusRatio?: number
  readonly labelPlacement?: 'legend' | 'inline'
}

function spreadDonutLabels<TSlice extends { readonly angle: number }>(
  slices: readonly TSlice[],
  labelRadius: number,
  height: number,
): Array<TSlice & { readonly labelDy: number }> {
  const naturalY = slices.map((slice) => -Math.cos(slice.angle) * labelRadius)
  const adjustedY = [...naturalY]
  const minimum = -height / 2 + 20
  const maximum = height / 2 - 20
  const gap = 32

  for (const side of [-1, 1] as const) {
    const indexes = slices
      .map((slice, index) => ({ index, side: Math.sin(slice.angle) < 0 ? -1 : 1 }))
      .filter((item) => item.side === side)
      .map((item) => item.index)
      .sort((left, right) => naturalY[left]! - naturalY[right]!)
    if (indexes.length === 0) continue
    adjustedY[indexes[0]!] = Math.max(minimum, naturalY[indexes[0]!]!)
    for (let position = 1; position < indexes.length; position += 1) {
      const index = indexes[position]!
      const previous = indexes[position - 1]!
      adjustedY[index] = Math.max(naturalY[index]!, adjustedY[previous]! + gap)
    }
    const overflow = adjustedY[indexes.at(-1)!]! - maximum
    if (overflow > 0) {
      for (const index of indexes) adjustedY[index] = adjustedY[index]! - overflow
    }
    for (let position = indexes.length - 2; position >= 0; position -= 1) {
      const index = indexes[position]!
      const next = indexes[position + 1]!
      adjustedY[index] = Math.min(adjustedY[index]!, adjustedY[next]! - gap)
    }
    const underflow = minimum - adjustedY[indexes[0]!]!
    if (underflow > 0) {
      for (const index of indexes) adjustedY[index] = adjustedY[index]! + underflow
    }
  }

  return slices.map((slice, index) => ({ ...slice, labelDy: adjustedY[index]! - naturalY[index]! }))
}

export function DonutChart({ state, innerRadiusRatio = 0.58, labelPlacement = 'legend', ...common }: DonutChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  bounded(innerRadiusRatio, 0, 0.9, messages.errors.invalidNumber)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        if (new Set(rows.map((row) => row.label)).size !== rows.length) {
          throw new RangeError('Donut labels must be unique.')
        }
        validDonutValues(rows.map((row) => row.value))
        const total = rows.reduce((sum, row) => sum + row.value, 0)
        const slices = pie(rows, { value: 'value', gapAngle: 0.02 })
        const visibleSlices = slices.filter((slice) => slice.value > 0)
        const definition = defineChart({
          tooltip: localizedTooltip(common.tooltip, formatters),
          chart: ({ width, height }) => {
            const inset = labelPlacement === 'inline' ? 16 : 8
            const radiusRatio = labelPlacement === 'inline' ? 0.6 : 0.84
            const radius = Math.max(0, Math.min(width, height) / 2 - inset) * radiusRatio
            const inlineLabels = spreadDonutLabels(visibleSlices, radius + 24, height).map((slice) => ({
              ...slice,
              detail: `${formatters.number(slice.value)} (${formatters.percentage(slice.fraction)})`,
            }))
            const polarMarks = [
              radialArc(slices, {
                innerRadius: ({ radius: outerRadius }) => outerRadius * innerRadiusRatio,
                cornerRadius: 3,
                color: 'id',
                key: 'id',
              }),
              ...(labelPlacement === 'inline'
                ? [
                    radialRule(visibleSlices, {
                      angle: 'angle', radius1: 1, radius2: 1, radius1Offset: -2, radius2Offset: 16,
                      key: 'id', stroke: 'var(--aperture-color-muted)', strokeOpacity: 0.45, strokeWidth: 1,
                    }),
                    radialText(inlineLabels, {
                      angle: 'angle', radius: 1, radiusOffset: 24, text: 'label', key: 'id',
                      fill: 'var(--aperture-color-text)', fontSize: 12, fontWeight: 650, anchor: 'outside',
                      dy: (slice) => slice.labelDy - 8,
                    }),
                    radialText(inlineLabels, {
                      angle: 'angle', radius: 1, radiusOffset: 24, text: 'detail', key: 'id',
                      fill: 'var(--aperture-color-muted)', fontSize: 11, anchor: 'outside',
                      dy: (slice) => slice.labelDy + 8,
                    }),
                    radialText([{ id: 'total', angle: 0, radius: 0, text: formatters.number(total) }], {
                      angle: 'angle', radius: 'radius', text: 'text', key: 'id',
                      fill: 'var(--aperture-color-text)', fontSize: 20, fontWeight: 700,
                    }),
                  ]
                : []),
            ] as const
            return {
              marks: [polar({
                inset,
                radiusRatio,
                marks: polarMarks,
                ...(labelPlacement === 'inline'
                  ? {
                      angle: { scale: scaleLinear().domain([0, Math.PI * 2]) },
                      radius: { scale: scaleLinear().domain([0, 1]) },
                    }
                  : {}),
              })],
              color: { domain: rows.map((row) => row.id), range: chartColors },
            }
          },
        })
        const legend = seriesLegend(rows.map((row) => row.label)).map((item, index) => ({
          ...item,
          detail: `${formatters.number(rows[index]?.value ?? 0)} (${formatters.percentage((rows[index]?.value ?? 0) / total)})`,
        }))
        return <ChartSurface {...common} definition={definition} legend={labelPlacement === 'inline' ? [] : legend} exactValues={exactValues(
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
  const formatters = useChartFormatters(common.formatters)
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
  const formatters = useChartFormatters(common.formatters)
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
          color: { domain: series, range: chartColors },
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
  const formatters = useChartFormatters(common.formatters)
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
          color: { range: chartColors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Node', 'Parent', 'Value'], rows.map((row) => exactRow(row.id, row.label, row.parentId, row.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}
