import { defineChart, dot, link, rect, text } from '@tanstack/charts'
import { treemap } from '@tanstack/charts/hierarchy/treemap'
import { forceLayout } from '@tanstack/charts/network/force'
import { sankeyDiagram } from '@tanstack/charts/network/sankey'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { exactRow, exactValues, seriesLegend } from './exact-values.js'
import { localizedTooltip, useChartFormatters } from './formatting.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, ChartSurface, SingletonChartStateBoundary } from './surface.js'
import type { ChartDataState, CommonChartProps, SingletonChartDataState } from './types.js'
import type { HierarchyDatum } from './polar-charts.js'
import { finite } from './validation.js'

const colors = [
  'var(--aperture-chart-1)',
  'var(--aperture-chart-2)',
  'var(--aperture-chart-3)',
  'var(--aperture-chart-4)',
  'var(--aperture-chart-5)',
] as const

export interface TreemapChartProps extends CommonChartProps {
  readonly state: ChartDataState<HierarchyDatum>
}

export function TreemapChart({ state, ...common }: TreemapChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <ChartStateBoundary state={state} rootProps={common}>
      {(data) => {
        const rows = data.map((datum) => ({ ...datum, value: datum.value === null ? null : finite(datum.value, messages.errors.invalidNumber) }))
        const definition = defineChart({
          marks: [treemap(rows, {
            nodeId: 'id', parentId: 'parentId', value: 'value', color: (node) => node.ancestorIds.at(-1) ?? node.id,
            label: (node) => node.data?.label ?? node.name, inset: 1, radius: 2, stroke: 'var(--aperture-color-background)', labelFill: 'var(--aperture-color-text)',
          })],
          guides: false,
          margin: 0,
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

export interface SankeyNodeDatum {
  readonly id: string
  readonly label: string
}

export interface SankeyLinkDatum {
  readonly id: string
  readonly source: string
  readonly target: string
  readonly value: number
}

export interface SankeyData {
  readonly nodes: readonly [SankeyNodeDatum, ...SankeyNodeDatum[]]
  readonly links: readonly [SankeyLinkDatum, ...SankeyLinkDatum[]]
}

export interface SankeyChartProps extends CommonChartProps {
  readonly state: SingletonChartDataState<SankeyData>
}

export function SankeyChart({ state, ...common }: SankeyChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  return (
    <SingletonChartStateBoundary state={state} rootProps={common}>
      {(graph) => {
        const links = graph.links.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        const definition = defineChart({
          marks: [sankeyDiagram({
            nodes: graph.nodes,
            links,
            nodeKey: 'id',
            source: 'source',
            target: 'target',
            value: 'value',
            linkKey: 'id',
            align: 'justify',
            nodePadding: 16,
            inset: 8,
            marks: ({ nodes, links: layoutLinks }) => [
              link(layoutLinks, { x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', key: 'key', stroke: 'var(--aperture-color-muted)', strokeOpacity: 0.45, strokeWidth: (flow) => flow.width }),
              rect(nodes, { x1: 'x0', x2: 'x1', y1: 'y0', y2: 'y1', key: 'key', color: 'key', inset: 0, radius: 2 }),
              text(nodes, { x: 'x', y: (node) => node.y0 - 6, text: (node) => node.data.label, key: 'key', fill: 'currentColor', fontSize: 12, fontWeight: 650 }),
            ] as const,
          })],
          guides: false,
          margin: 0,
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        const nodeLabels = new Map(graph.nodes.map((node) => [node.id, node.label]))
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Source', 'Target', 'Value'], links.map((row) => exactRow(row.id, nodeLabels.get(row.source) ?? row.source, nodeLabels.get(row.target) ?? row.target, row.value)),
        )} />
      }}
    </SingletonChartStateBoundary>
  )
}

export interface NetworkNodeDatum {
  readonly id: string
  readonly label: string
  readonly group?: string
}

export interface NetworkLinkDatum {
  readonly id: string
  readonly source: string
  readonly target: string
  readonly weight?: number
}

export interface NetworkData {
  readonly nodes: readonly [NetworkNodeDatum, ...NetworkNodeDatum[]]
  readonly links: readonly NetworkLinkDatum[]
}

export interface NetworkChartProps extends CommonChartProps {
  readonly state: SingletonChartDataState<NetworkData>
  readonly iterations?: number
}

export function NetworkChart({ state, iterations = 300, ...common }: NetworkChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters()
  finite(iterations, messages.errors.invalidNumber)
  return (
    <SingletonChartStateBoundary state={state} rootProps={common}>
      {(input) => {
        const graph = forceLayout(input.nodes, input.links, {
          nodeKey: 'id', source: 'source', target: 'target', iterations,
          forces: [
            { type: 'link', distance: 48, strength: (edge) => edge.weight === undefined ? 1 : finite(edge.weight, messages.errors.invalidNumber) },
            { type: 'manyBody', strength: -140 },
            { type: 'center' },
            { type: 'collide', radius: 10 },
          ],
        })
        const definition = defineChart({
          marks: [
            link(graph.links, { x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', key: 'id', stroke: 'var(--aperture-color-muted)', strokeOpacity: 0.5 }),
            dot(graph.nodes, { x: 'x', y: 'y', color: (node) => node.group ?? 'Value', key: 'id', r: 5 }),
            text(graph.nodes, { x: 'x', y: 'y', text: 'label', key: 'id', fill: 'currentColor', dx: 8, fontSize: 11 }),
          ],
          x: { scale: scaleLinear().domain(graph.xDomain) },
          y: { scale: scaleLinear().domain(graph.yDomain) },
          guides: false,
          color: { range: colors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        const nodeLabels = new Map(input.nodes.map((node) => [node.id, node.label]))
        return <ChartSurface {...common} definition={definition} legend={seriesLegend(input.nodes.map((node) => node.group ?? 'Value'))} exactValues={exactValues(
          ['Entity', 'Label', 'Source', 'Target', 'Weight'], [
            ...input.nodes.map((node) => exactRow(`node-${node.id}`, 'Node', node.label, null, null, null)),
            ...input.links.map((edge) => exactRow(edge.id, 'Link', edge.id, nodeLabels.get(edge.source) ?? edge.source, nodeLabels.get(edge.target) ?? edge.target, edge.weight ?? 1)),
          ],
        )} />
      }}
    </SingletonChartStateBoundary>
  )
}
