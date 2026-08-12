import { useState } from 'react'
import {
  ChartProvider,
  LineChart,
  StackedAreaChart,
  ToggleControl,
  chartData,
} from '@kevin-courbet/aperture'
import {
  AdvancedChart,
  BrushX,
  ZoomX,
  controlledSignal,
  defineChart,
  lineY,
  scaleLinear,
  type BrushRange,
  type BrushXChange,
  type ZoomXChange,
  type ZoomXWindow,
} from '@kevin-courbet/aperture/tanstack'
import { compositionByMonth, throughputByMonth } from '../../src/fixtures/operations'
import { ExactValueSelectionExample, FullscreenTimeRangeExample } from './ChartExamples'

export type InteractionMode = 'focus' | 'selection' | 'legend' | 'brush' | 'zoom' | 'fullscreen'

const completedSeries = throughputByMonth.map((row, index) => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value' as const, value: row.completed },
  month: index + 1,
}))

const stackedRows = compositionByMonth.flatMap((row) => [
  { id: `${row.period}-planned`, date: new Date(`${row.period}T00:00:00Z`), value: row.planned, series: 'planned' },
  { id: `${row.period}-reactive`, date: new Date(`${row.period}T00:00:00Z`), value: row.reactive, series: 'reactive' },
  { id: `${row.period}-research`, date: new Date(`${row.period}T00:00:00Z`), value: row.research, series: 'research' },
])

const seriesNames = ['planned', 'reactive', 'research'] as const

function FocusExample() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <section className="catalog-interaction">
        <div className="catalog-callout"><h2>Focus a point with Tab and arrow keys, or point at the plot.</h2><p>The package tooltip and crosshair use the nearest monthly value. The exact-value disclosure remains available below the plot.</p></div>
        <div className="catalog-interaction-chart">
          <LineChart ariaLabel="Completed work focus example" ariaDescription="Monthly completed items with nearest-point focus, tooltip, and crosshair." state={chartData(completedSeries)} xLabel="Month" yLabel="Completed items" tooltip crosshair reference={{ value: 55, label: 'Goal: 55 items' }} />
        </div>
      </section>
    </ChartProvider>
  )
}

function LegendExample() {
  const [visible, setVisible] = useState<ReadonlySet<string>>(() => new Set(seriesNames))
  const visibleNames = seriesNames.filter((series) => visible.has(series))
  const rows = stackedRows.filter((row) => visible.has(row.series))

  function change(series: string, selected: boolean) {
    setVisible((current) => {
      const next = new Set(current)
      if (selected) next.add(series)
      else if (next.size > 1) next.delete(series)
      return next
    })
  }

  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <section className="catalog-interaction">
        <div className="catalog-callout"><h2>Filter work series.</h2><p>Each selected toggle keeps its series in the chart and exact-value output. At least one series remains selected.</p></div>
        <div className="catalog-toolbar catalog-legend-controls" aria-label="Visible work series">
          {seriesNames.map((series) => <ToggleControl key={series} label={series} isSelected={visible.has(series)} onChange={(selected) => change(series, selected)} />)}
        </div>
        <p className="catalog-legend-summary" role="status">Visible series: {visibleNames.join(', ')}</p>
        <div className="catalog-interaction-chart">
          <StackedAreaChart ariaLabel="Filtered work composition" ariaDescription={`Visible series: ${visibleNames.join(', ')}.`} state={chartData(rows)} seriesOrder={visibleNames} xLabel="Month" yLabel="Items" />
        </div>
      </section>
    </ChartProvider>
  )
}

const numericRows = throughputByMonth.map((row, index) => ({ month: index + 1, completed: row.completed }))
const fullRange: BrushRange<number> = { start: 1, end: 6 }
const focusedRange: BrushRange<number> = { start: 4, end: 6 }

function BrushExample() {
  const [range, setRange] = useState<BrushRange<number>>(fullRange)
  const definition = defineChart({
    marks: [lineY(numericRows, { x: 'month', y: 'completed', points: true, stroke: 'var(--aperture-chart-1)', strokeWidth: 2.25 })],
    x: { scale: scaleLinear().domain([1, 6]), axis: { label: 'Month' } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Completed items' } },
    controls: [BrushX({
      range: controlledSignal<BrushRange<number>, BrushXChange<number>>(range, (next, { reason }) => {
        if (reason.type === 'commit') setRange(next)
      }),
      values: numericRows.map((row) => row.month),
      format: (month) => `Month ${month}`,
      ariaLabel: 'Completed work reporting range',
      startAriaLabel: 'Range start',
      endAriaLabel: 'Range end',
    })],
  })
  return (
    <section className="catalog-interaction">
      <div className="catalog-callout"><h2>Drag the range or use its two keyboard sliders.</h2><p>Arrow keys adjust a focused handle. The summary reports the accepted semantic range.</p></div>
      <div className="catalog-toolbar">
        <p role="status">Selected months: {range.start} to {range.end}</p>
        <div><button type="button" onClick={() => setRange(focusedRange)}>Select last three months</button> <button type="button" disabled={range.start === 1 && range.end === 6} onClick={() => setRange(fullRange)}>Reset range</button></div>
      </div>
      <div className="catalog-interaction-chart"><AdvancedChart definition={definition} renderer="svg" ariaLabel="Completed work with reporting range brush" ariaDescription={`Selected months ${range.start} to ${range.end}.`} /></div>
    </section>
  )
}

const fullWindow: ZoomXWindow<number> = { start: 1, end: 6 }
const zoomedWindow: ZoomXWindow<number> = { start: 3, end: 5 }

function ZoomExample() {
  const [window, setWindow] = useState<ZoomXWindow<number>>(fullWindow)
  const visibleRows = numericRows.filter((row) => row.month >= window.start && row.month <= window.end)
  const definition = defineChart({
    marks: [lineY(visibleRows, { x: 'month', y: 'completed', points: true, stroke: 'var(--aperture-chart-1)', strokeWidth: 2.25 })],
    x: { scale: scaleLinear().domain([window.start, window.end]), axis: { label: 'Month' } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Completed items' } },
    controls: [ZoomX({
      window: controlledSignal<ZoomXWindow<number>, ZoomXChange<number>>(window, setWindow),
      extent: [1, 6],
      scaleExtent: [1, 6],
      keyboard: true,
      format: (month) => `Month ${month.toFixed(1)}`,
      ariaLabel: 'Completed work zoom surface',
      ariaDescription: 'Use plus and minus to zoom, arrow keys to pan, and zero to reset.',
    })],
  })
  return (
    <section className="catalog-interaction">
      <div className="catalog-callout"><h2>Focus the plot before wheel, keyboard, or pointer zoom.</h2><p>The controlled numeric window filters the rendered rows. Reset returns to all six months.</p></div>
      <div className="catalog-toolbar">
        <p role="status">Visible months: {window.start.toFixed(1)} to {window.end.toFixed(1)}; {visibleRows.length} values</p>
        <div><button type="button" onClick={() => setWindow(zoomedWindow)}>Zoom to months 3 to 5</button> <button type="button" disabled={window.start === 1 && window.end === 6} onClick={() => setWindow(fullWindow)}>Reset zoom</button></div>
      </div>
      <div className="catalog-interaction-chart"><AdvancedChart definition={definition} renderer="svg" ariaLabel="Completed work with zoom and pan" ariaDescription={`Visible months ${window.start.toFixed(1)} to ${window.end.toFixed(1)}.`} /></div>
    </section>
  )
}

export function InteractionExample({ mode }: { mode: InteractionMode }) {
  if (mode === 'selection') return <ExactValueSelectionExample />
  if (mode === 'fullscreen') return <FullscreenTimeRangeExample />
  if (mode === 'legend') return <LegendExample />
  if (mode === 'brush') return <BrushExample />
  if (mode === 'zoom') return <ZoomExample />
  return <FocusExample />
}
