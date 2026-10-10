import { defineChart } from '@tanstack/charts'
import { geoShape } from '@tanstack/charts/geo'
import { geoIdentity, geoMercator } from 'd3-geo'
import { useChartConfiguration } from './provider.js'
import { continuousLegend, continuousPaint, validContinuousScale } from './annotations.js'
import { exactRow, exactValues, seriesLegend, solidLineSymbol } from './exact-values.js'
import { localizedTooltip, useChartFormatters } from './formatting.js'
import { chartColors } from './palette.js'
import { ChartStateBoundary, ChartSurface } from './surface.js'
import type { ChartDataState, CommonChartProps, ContinuousColorScale, NumericPoint } from './types.js'
import { numericPoint } from './validation.js'

export type MapProjection = 'mercator' | 'identity'

export interface PolygonGeometry {
  readonly type: 'Polygon'
  readonly coordinates: [number, number][][]
}

export interface MultiPolygonGeometry {
  readonly type: 'MultiPolygon'
  readonly coordinates: [number, number][][][]
}

export interface ChoroplethDatum {
  readonly type: 'Feature'
  readonly properties: {
    readonly id: string
    readonly label: string
    readonly value: NumericPoint
  }
  readonly geometry: PolygonGeometry | MultiPolygonGeometry
}

interface ValidChoroplethDatum {
  readonly type: 'Feature'
  readonly properties: {
    readonly id: string
    readonly label: string
    readonly value: number | null
  }
  readonly geometry: PolygonGeometry | MultiPolygonGeometry
}

export interface ChoroplethChartProps extends CommonChartProps {
  readonly state: ChartDataState<ChoroplethDatum>
  readonly projection?: MapProjection
  readonly colorScale: ContinuousColorScale
  /** Legend name for the color scale, including the unit. */
  readonly valueLabel?: string
}

function projectionType(projection: MapProjection) {
  return projection === 'mercator' ? geoMercator : geoIdentity
}

export function ChoroplethChart({ state, projection = 'mercator', colorScale, valueLabel, ...common }: ChoroplethChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  validContinuousScale(colorScale, 'Choropleth')
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows: ValidChoroplethDatum[] = data.map((datum) => ({
          ...datum,
          properties: { ...datum.properties, value: numericPoint(datum.properties.value, messages.errors.invalidNumber) },
        }))
        const definition = defineChart({
          marks: [geoShape(rows, {
            key: (feature) => feature.properties.id,
            projection: { type: projectionType(projection), fit: { type: 'FeatureCollection', features: rows } },
            fill: (feature) => feature.properties.value === null
              ? 'var(--aperture-chart-missing)'
              : continuousPaint(colorScale, feature.properties.value).fill,
            stroke: 'var(--aperture-color-background)',
            strokeWidth: 0.75,
          })],
          margin: 8,
          scales: { x: null, y: null },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        const legend = [
          continuousLegend(colorScale, valueLabel ?? 'Value', formatters.number),
          ...(data.some((datum) => datum.properties.value.kind === 'missing')
            ? [{ label: messages.legend.missing, symbol: { kind: 'missing' } } as const]
            : []),
        ]
        return <ChartSurface {...common} definition={definition} legend={legend} exactValues={exactValues(
          ['Region', 'Value'], data.map((datum) => exactRow(datum.properties.id, datum.properties.label, datum.properties.value)),
        )} />
      }}
    </ChartStateBoundary>
  )
}

export interface RouteGeometry {
  readonly type: 'LineString'
  readonly coordinates: [number, number][]
}

export interface RouteDatum {
  readonly type: 'Feature'
  readonly properties: {
    readonly id: string
    readonly label: string
    readonly series?: string
  }
  readonly geometry: RouteGeometry
}

export interface RouteMapChartProps extends CommonChartProps {
  readonly state: ChartDataState<RouteDatum>
  readonly projection?: MapProjection
}

export function RouteMapChart({ state, projection = 'mercator', ...common }: RouteMapChartProps) {
  const formatters = useChartFormatters(common.formatters)
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = [...data]
        const definition = defineChart({
          marks: [geoShape(rows, {
            key: (feature) => feature.properties.id,
            projection: { type: projectionType(projection), fit: { type: 'FeatureCollection', features: rows } },
            color: (feature) => feature.properties.series ?? 'Route',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2.5,
          })],
          margin: 8,
          scales: { x: null, y: null },
          color: { range: chartColors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(rows.map((row) => row.properties.series ?? 'Route'), solidLineSymbol)} exactValues={exactValues(
          ['Route', 'Series'], rows.map((row) => exactRow(row.properties.id, row.properties.label, row.properties.series ?? 'Route')),
        )} />
      }}
    </ChartStateBoundary>
  )
}
