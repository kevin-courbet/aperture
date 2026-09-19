import { defineChart, dot, link, rect, text } from '@tanstack/charts'
import { treemap } from '@tanstack/charts/hierarchy/treemap'
import { forceLayout } from '@tanstack/charts/network/force'
import { sankeyDiagram } from '@tanstack/charts/network/sankey'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { curveBumpX } from 'd3-shape'
import { exactRow, exactValues, seriesLegend } from './exact-values.js'
import { localizedTooltip, useChartFormatters } from './formatting.js'
import { chartColors } from './palette.js'
import { useChartConfiguration } from './provider.js'
import { ChartStateBoundary, ChartSurface, SingletonChartStateBoundary } from './surface.js'
import type { ChartDataState, CommonChartProps, SingletonChartDataState } from './types.js'
import type { HierarchyDatum } from './polar-charts.js'
import { bounded, finite } from './validation.js'

const sankeyCurve = d3Curve(curveBumpX)

export interface TreemapChartProps extends CommonChartProps {
  readonly state: ChartDataState<HierarchyDatum>
}

export function TreemapChart({ state, ...common }: TreemapChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
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

export interface SankeyNodeLabelContext {
  readonly node: SankeyNodeDatum
  readonly value: number
  readonly depth: number
  readonly height: number
}

export type SankeyNodeLabels =
  | { readonly placement: 'above' }
  | {
      readonly placement: 'inside'
      readonly details?: (context: SankeyNodeLabelContext) => readonly string[]
      readonly color?: (context: SankeyNodeLabelContext) => string
    }

export interface SankeyAppearance {
  readonly nodeWidth?: number
  readonly nodePadding?: number
  readonly inset?: number
  readonly links?: {
    readonly color?: 'muted' | 'source' | 'target'
    readonly curve?: 'straight' | 'smooth'
    readonly opacity?: number
  }
  readonly nodeLabels?: SankeyNodeLabels
}

export interface SankeyChartProps extends CommonChartProps {
  readonly state: SingletonChartDataState<SankeyData>
  readonly appearance?: SankeyAppearance
}

export function SankeyChart({ state, appearance, ...common }: SankeyChartProps) {
  const { messages } = useChartConfiguration()
  const formatters = useChartFormatters(common.formatters)
  const nodeWidth = finite(appearance?.nodeWidth ?? 24, 'Sankey node width must be finite.')
  if (nodeWidth <= 0) throw new RangeError('Sankey node width must be greater than zero.')
  const nodePadding = finite(appearance?.nodePadding ?? 16, 'Sankey node padding must be finite.')
  if (nodePadding < 0) throw new RangeError('Sankey node padding must not be negative.')
  const inset = finite(appearance?.inset ?? 8, 'Sankey inset must be finite.')
  if (inset < 0) throw new RangeError('Sankey inset must not be negative.')
  const linkOpacity = bounded(appearance?.links?.opacity ?? 0.45, 0, 1, 'Sankey link opacity must be between zero and one.')
  const linkColor = appearance?.links?.color ?? 'muted'
  const linkCurve = appearance?.links?.curve ?? 'straight'
  const nodeLabels = appearance?.nodeLabels ?? { placement: 'above' as const }
  return (
    <SingletonChartStateBoundary state={state} rootProps={common}>
      {(graph) => {
        const links = graph.links.map((datum) => ({ ...datum, value: finite(datum.value, messages.errors.invalidNumber) }))
        const nodeColors = new Map(graph.nodes.map((node, index) => [node.id, chartColors[index % chartColors.length]!] as const))
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
            nodeWidth,
            nodePadding,
            inset,
            marks: ({ nodes, links: layoutLinks }) => {
              const labelRows = nodes.flatMap((node) => {
                const context: SankeyNodeLabelContext = {
                  node: node.data,
                  value: node.value,
                  depth: node.depth,
                  height: node.y1 - node.y0,
                }
                const lines = nodeLabels.placement === 'inside'
                  ? [node.data.label, ...(nodeLabels.details?.(context) ?? [formatters.number(node.value)])]
                  : [node.data.label]
                const lineHeight = 13
                const firstLineY = nodeLabels.placement === 'inside'
                  ? node.y - ((lines.length - 1) * lineHeight) / 2
                  : node.y0 - 6
                return lines.map((label, lineIndex) => ({
                  ...node,
                  label,
                  labelKey: `${node.key}:${lineIndex}`,
                  labelY: firstLineY + lineIndex * lineHeight,
                  labelColor: nodeLabels.placement === 'inside'
                    ? (nodeLabels.color?.(context) ?? 'var(--aperture-color-background)')
                    : 'var(--aperture-color-text)',
                  lineIndex,
                }))
              })
              const linkStroke = linkColor === 'muted'
                ? 'var(--aperture-color-muted)'
                : (flow: (typeof layoutLinks)[number]) => nodeColors.get(linkColor === 'source' ? flow.sourceKey : flow.targetKey) ?? chartColors[0]
              return [
                link(layoutLinks, {
                  x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', key: 'key', stroke: linkStroke,
                  strokeOpacity: linkOpacity, strokeWidth: (flow) => flow.width, lineCap: 'butt',
                  ...(linkCurve === 'smooth' ? { curve: sankeyCurve } : {}),
                }),
                rect(nodes, { x1: 'x0', x2: 'x1', y1: 'y0', y2: 'y1', key: 'key', color: 'key', inset: 0, radius: 4 }),
                text(labelRows.filter((row) => row.lineIndex === 0), {
                  x: 'x', y: 'labelY', text: 'label', key: 'labelKey', fill: (row) => row.labelColor,
                  fontSize: 11, fontWeight: 650,
                }),
                text(labelRows.filter((row) => row.lineIndex > 0), {
                  x: 'x', y: 'labelY', text: 'label', key: 'labelKey', fill: (row) => row.labelColor,
                  fontSize: 10, fontWeight: 600,
                }),
              ] as const
            },
          })],
          guides: false,
          margin: 0,
          color: { domain: graph.nodes.map((node) => node.id), range: chartColors },
          tooltip: localizedTooltip(common.tooltip, formatters),
        })
        const nodeLabelById = new Map(graph.nodes.map((node) => [node.id, node.label]))
        return <ChartSurface {...common} definition={definition} exactValues={exactValues(
          ['Source', 'Target', 'Value'], links.map((row) => exactRow(row.id, nodeLabelById.get(row.source) ?? row.source, nodeLabelById.get(row.target) ?? row.target, row.value)),
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
  const formatters = useChartFormatters(common.formatters)
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
          color: { range: chartColors },
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
