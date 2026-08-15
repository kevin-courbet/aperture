import { useRef, useState } from 'react'
import {
  AreaChart,
  BarChart,
  BeeswarmChart,
  BoxPlotChart,
  CandlestickChart,
  ChartProvider,
  ChartWidget,
  ChoroplethChart,
  DataTableControl,
  DensityChart,
  DonutChart,
  EcdfChart,
  ErrorBarChart,
  FacetChart,
  FullscreenControl,
  GaugeChart,
  HeatmapChart,
  HistogramChart,
  LineChart,
  NetworkChart,
  RadarChart,
  RangeChart,
  RidgelineChart,
  RouteMapChart,
  SankeyChart,
  ScatterChart,
  StackedAreaChart,
  SunburstChart,
  TimeRangeControl,
  TreemapChart,
  ViolinChart,
  WaterfallChart,
  chartData,
  type ChartDataState,
  type ChartRenderer,
  type SingletonChartDataState,
  type TimeAxisOptions,
  type TimeSeriesDatum,
} from '@kevin-courbet/aperture'
import { allocation, cashMovement, closingCash, marketSeries } from '../../src/fixtures/finance'
import { deliveryRouteFeature, schematicRegions } from '../../src/fixtures/geography'
import {
  channelVolume,
  compositionByMonth,
  deliveryIntervals,
  serviceMatrix,
  throughputByMonth,
} from '../../src/fixtures/operations'
import {
  cohortDensityProfiles,
  cohortDistributions,
  facetedOutcomes,
  outcomeDensityStudy,
  radarMeasures,
  relationshipStudy,
  responseTimes,
} from '../../src/fixtures/research'
import { flow, hierarchyNodes, network } from '../../src/fixtures/topology'

export type Renderer = ChartRenderer
export type CatalogTheme = 'paper' | 'night'
export type DataState = 'ready' | 'loading' | 'empty' | 'error'

export type ExampleControls = {
  renderer: Renderer
  width: number
  theme: CatalogTheme
  state: DataState
  showGoal?: boolean
}

export const primitiveArgTypes = {
  renderer: { control: 'inline-radio', options: ['svg', 'canvas'] },
  width: { control: { type: 'range', min: 320, max: 1200, step: 40 } },
  theme: { control: 'inline-radio', options: ['paper', 'night'] },
  state: { control: 'select', options: ['ready', 'loading', 'empty', 'error'] },
  showGoal: { control: false, table: { disable: true } },
} as const

export const lineGoalArgType = {
  showGoal: { control: 'boolean', name: 'Goal visibility' },
} as const

export const defaultControls: ExampleControls = {
  renderer: 'svg',
  width: 880,
  theme: 'paper',
  state: 'ready',
}

export type ChartName =
  | 'LineChart' | 'AreaChart' | 'BarChart' | 'ScatterChart' | 'HistogramChart'
  | 'BoxPlotChart' | 'HeatmapChart' | 'RangeChart' | 'ErrorBarChart' | 'StackedAreaChart'
  | 'FacetChart' | 'DonutChart' | 'GaugeChart' | 'RadarChart' | 'WaterfallChart'
  | 'CandlestickChart' | 'TreemapChart' | 'SunburstChart' | 'SankeyChart'
  | 'NetworkChart' | 'ChoroplethChart' | 'RouteMapChart' | 'ViolinChart'
  | 'RidgelineChart' | 'BeeswarmChart' | 'DensityChart' | 'EcdfChart'

const metadata: Record<ChartName, { title: string; description: string }> = {
  LineChart: { title: 'Completed work by month', description: 'Monthly completed items. The optional reference shows the 55-item goal.' },
  AreaChart: { title: 'Queued work by month', description: 'Monthly queued items. The filled area shows queued volume.' },
  BarChart: { title: 'Volume by channel', description: 'Completed items grouped by acquisition channel.' },
  ScatterChart: { title: 'Effort and outcome', description: 'Outcome score by effort and study group.' },
  HistogramChart: { title: 'Response time distribution', description: 'Response times in milliseconds grouped into fixed-width bins.' },
  BoxPlotChart: { title: 'Outcome spread by cohort', description: 'Median, quartiles, and range for each observed cohort.' },
  HeatmapChart: { title: 'Service score matrix', description: 'Service scores by weekday, with exact values available in chart output.' },
  RangeChart: { title: 'Delivery interval by region', description: 'Expected low and high delivery duration, in days.' },
  ErrorBarChart: { title: 'Delivery estimate uncertainty', description: 'Mean duration with lower and upper uncertainty bounds.' },
  StackedAreaChart: { title: 'Work composition over time', description: 'Monthly work split by planned, reactive, and research categories.' },
  FacetChart: { title: 'Outcome by team size', description: 'Observed quarterly outcomes on repeated numeric UTC date scales.' },
  DonutChart: { title: 'Allocation share', description: 'Allocation percentage by work category.' },
  GaugeChart: { title: 'Quality score', description: 'Current quality score of 81 on a zero to 100 scale.' },
  RadarChart: { title: 'Evaluation profile', description: 'Five evaluation dimensions on a common zero to 100 scale.' },
  WaterfallChart: { title: 'Cash movement', description: `Opening cash and signed movements produce closing cash of £${closingCash}k.` },
  CandlestickChart: { title: 'Daily market range', description: 'Daily open, high, low, and close values.' },
  TreemapChart: { title: 'Portfolio allocation', description: 'All nested portfolio nodes, including product and service children.' },
  SunburstChart: { title: 'Portfolio levels', description: 'All portfolio nodes shown as nested radial levels.' },
  SankeyChart: { title: 'Visit conversion flow', description: 'Movement from visits to trials, paid accounts, or exit.' },
  NetworkChart: { title: 'Service dependencies', description: 'Directed dependencies between edge, service, and data nodes.' },
  ChoroplethChart: { title: 'Schematic regional service score', description: 'Service scores on four schematic regions. These shapes are not countries or geographic boundaries.' },
  RouteMapChart: { title: 'North to south route', description: 'A geographic route through ordered delivery stops from Glasgow to London.' },
  ViolinChart: { title: 'Cohort density and spread', description: 'Deterministic Gaussian-kernel density profiles derived from the cohort observations.' },
  RidgelineChart: { title: 'Cohort density profiles', description: 'Aligned deterministic Gaussian-kernel density profiles derived from the cohort observations.' },
  BeeswarmChart: { title: 'Individual cohort outcomes', description: 'Each observed outcome remains visible within its cohort.' },
  DensityChart: { title: 'Effort and outcome density', description: 'Deterministic two-dimensional observations show density by study group.' },
  EcdfChart: { title: 'Cumulative response times', description: 'Share of responses at or below each duration.' },
}

const completedSeries = throughputByMonth.map((row): TimeSeriesDatum => ({
  id: `completed-${row.period}`,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.completed },
}))

export const calendarContextSeries: readonly TimeSeriesDatum[] = Array.from({ length: 18 }, (_, index) => ({
  id: `calendar-${index}`,
  date: new Date(Date.UTC(2025 + Math.floor((index + 2) / 12), (index + 2) % 12, 1)),
  value: { kind: 'value', value: 40 + index + Math.sin(index / 2) * 4 },
}))

export const midMonthObservationSeries: readonly TimeSeriesDatum[] = [0, 1, 2].map((month) => ({
  id: `mid-month-${month}`,
  date: new Date(Date.UTC(2025, month, 15)),
  value: { kind: 'value', value: 40 + month * 4 },
}))

const queuedSeries = throughputByMonth.map((row): TimeSeriesDatum => ({
  id: `queued-${row.period}`,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.queued },
}))

const barData = channelVolume.map((row) => ({ id: row.category.toLowerCase(), category: row.category, value: row.value }))
const scatterData = relationshipStudy.map((row) => ({ id: row.subject, x: row.effort, y: row.outcome, series: row.group }))
const histogramData = [
  { id: '118-135', start: 118, end: 135, count: responseTimes.filter((value) => value < 135).length },
  { id: '135-152', start: 135, end: 152, count: responseTimes.filter((value) => value >= 135 && value < 152).length },
  { id: '152-169', start: 152, end: 169, count: responseTimes.filter((value) => value >= 152 && value < 169).length },
  { id: '169-189', start: 169, end: 189, count: responseTimes.filter((value) => value >= 169).length },
]
const boxData = cohortDistributions.map((row, index) => ({ id: `box-${index}`, category: row.cohort, value: row.value }))
const heatmapData = serviceMatrix.map((row, index) => ({ id: `cell-${index}`, x: row.column, y: row.row, value: row.value }))
const rangeData = deliveryIntervals.map((row, index) => ({ id: `range-${index}`, date: new Date(Date.UTC(2025, index, 1)), low: row.low, high: row.high, series: row.category }))
const errorBarData = deliveryIntervals.map((row, index) => ({ id: `error-${index}`, category: row.category, estimate: row.value, low: row.low, high: row.high }))
const stackedAreaData = compositionByMonth.flatMap((row) => [
  { id: `${row.period}-planned`, date: new Date(`${row.period}T00:00:00Z`), value: row.planned, series: 'planned' },
  { id: `${row.period}-reactive`, date: new Date(`${row.period}T00:00:00Z`), value: row.reactive, series: 'reactive' },
  { id: `${row.period}-research`, date: new Date(`${row.period}T00:00:00Z`), value: row.research, series: 'research' },
])
const facetData = facetedOutcomes.map((row, index) => ({
  id: `facet-${index}`,
  facet: row.panel,
  x: Date.parse(`${row.period}T00:00:00Z`),
  y: row.value,
  series: 'Outcome',
}))
const donutData = allocation.map((row, index) => ({ id: `slice-${index}`, label: row.category, value: row.value }))
const gaugeDatum = { value: 81, minimum: 0, maximum: 100, label: '81 of 100' }
const radarData = radarMeasures.map((row, index) => ({ id: `radar-${index}`, dimension: row.dimension, value: row.value, series: 'Current' }))
const candleData = marketSeries.map((row, index) => ({ id: `candle-${index}`, date: new Date(`${row.period}T00:00:00Z`), open: row.open, high: row.high, low: row.low, close: row.close }))
const beeswarmData = cohortDistributions.map((row, index) => ({ id: `bee-${index}`, category: row.cohort, value: row.value }))
const ecdfData = responseTimes.map((value, index) => ({ id: `ecdf-${index}`, value, proportion: (index + 1) / responseTimes.length }))

function stateFor<TDatum>(state: DataState, data: readonly TDatum[]): ChartDataState<TDatum> {
  if (state === 'ready') return chartData(data)
  if (state === 'loading') return { status: 'loading' }
  if (state === 'empty') return { status: 'empty', message: 'No results match this period.' }
  return { status: 'error', error: new Error('The chart data could not be read.') }
}

function singletonStateFor<TDatum>(state: DataState, datum: TDatum): SingletonChartDataState<TDatum> {
  if (state === 'ready') return { status: 'ready', datum }
  if (state === 'loading') return { status: 'loading' }
  if (state === 'empty') return { status: 'empty', message: 'No results match this period.' }
  return { status: 'error', error: new Error('The chart data could not be read.') }
}

function commonProps(controls: ExampleControls, title: string, description: string) {
  return {
    ariaLabel: title,
    ariaDescription: description,
    renderer: controls.renderer,
  }
}

function ConcreteChart({
  name,
  controls,
  lineData = completedSeries,
  timeAxis,
}: {
  name: ChartName
  controls: ExampleControls
  lineData?: readonly TimeSeriesDatum[]
  timeAxis?: TimeAxisOptions
}) {
  const details = metadata[name]
  const common = commonProps(controls, details.title, details.description)
  switch (name) {
    case 'LineChart':
      return <LineChart {...common} state={stateFor(controls.state, lineData)} xLabel="Month" yLabel="Completed items" reference={controls.showGoal ? { value: 55, label: 'Goal: 55 items' } : undefined} timeAxis={timeAxis} />
    case 'AreaChart':
      return <AreaChart {...common} state={stateFor(controls.state, queuedSeries)} xLabel="Month" yLabel="Queued items" />
    case 'BarChart':
      return <BarChart {...common} state={stateFor(controls.state, barData)} orientation="vertical" layout="single" categoryLabel="Channel" valueLabel="Completed items" />
    case 'ScatterChart':
      return <ScatterChart {...common} state={stateFor(controls.state, scatterData)} xLabel="Effort" yLabel="Outcome score" />
    case 'HistogramChart':
      return <HistogramChart {...common} state={stateFor(controls.state, histogramData)} valueLabel="Response time (ms)" countLabel="Responses" />
    case 'BoxPlotChart':
      return <BoxPlotChart {...common} state={stateFor(controls.state, boxData)} categoryLabel="Cohort" valueLabel="Outcome" />
    case 'HeatmapChart':
      return <HeatmapChart {...common} state={stateFor(controls.state, heatmapData)} colorDomain={[0, 100]} xLabel="Weekday" yLabel="Service" />
    case 'RangeChart':
      return <RangeChart {...common} state={stateFor(controls.state, rangeData)} xLabel="Month" yLabel="Duration (days)" />
    case 'ErrorBarChart':
      return <ErrorBarChart {...common} state={stateFor(controls.state, errorBarData)} categoryLabel="Region" valueLabel="Duration (days)" />
    case 'StackedAreaChart':
      return <StackedAreaChart {...common} state={stateFor(controls.state, stackedAreaData)} seriesOrder={['planned', 'reactive', 'research']} xLabel="Month" yLabel="Items" />
    case 'FacetChart':
      return <FacetChart {...common} state={stateFor(controls.state, facetData)} columns={2} xLabel="UTC date (milliseconds)" yLabel="Outcome" />
    case 'DonutChart':
      return <DonutChart {...common} state={stateFor(controls.state, donutData)} />
    case 'GaugeChart':
      return <GaugeChart {...common} state={singletonStateFor(controls.state, gaugeDatum)} />
    case 'RadarChart':
      return <RadarChart {...common} state={stateFor(controls.state, radarData)} dimensions={['Accuracy', 'Speed', 'Coverage', 'Clarity', 'Cost']} domain={[0, 100]} />
    case 'WaterfallChart':
      return <WaterfallChart {...common} state={stateFor(controls.state, cashMovement)} includeTotal valueLabel="Cash (£k)" />
    case 'CandlestickChart':
      return <CandlestickChart {...common} state={stateFor(controls.state, candleData)} candleInterval={{ unit: 'day', step: 1 }} priceLabel="Price (£)" />
    case 'TreemapChart':
      return <TreemapChart {...common} state={stateFor(controls.state, hierarchyNodes)} />
    case 'SunburstChart':
      return <SunburstChart {...common} state={stateFor(controls.state, hierarchyNodes)} rootId="portfolio" />
    case 'SankeyChart':
      return <SankeyChart {...common} state={singletonStateFor(controls.state, flow)} />
    case 'NetworkChart':
      return <NetworkChart {...common} state={singletonStateFor(controls.state, network)} />
    case 'ChoroplethChart':
      return <ChoroplethChart {...common} state={stateFor(controls.state, schematicRegions)} projection="identity" colorDomain={[0, 100]} />
    case 'RouteMapChart':
      return <RouteMapChart {...common} state={stateFor(controls.state, [deliveryRouteFeature])} projection="mercator" />
    case 'ViolinChart':
      return <ViolinChart {...common} state={stateFor(controls.state, cohortDensityProfiles)} categoryLabel="Cohort" valueLabel="Outcome" />
    case 'RidgelineChart':
      return <RidgelineChart {...common} state={stateFor(controls.state, cohortDensityProfiles)} categoryLabel="Cohort" valueLabel="Outcome" />
    case 'BeeswarmChart':
      return <BeeswarmChart {...common} state={stateFor(controls.state, beeswarmData)} valueLabel="Outcome" />
    case 'DensityChart':
      return <DensityChart {...common} state={stateFor(controls.state, outcomeDensityStudy)} xLabel="Effort" yLabel="Outcome" bandwidth={16} thresholds={8} />
    case 'EcdfChart':
      return <EcdfChart {...common} state={stateFor(controls.state, ecdfData)} valueLabel="Response time (ms)" proportionLabel="Cumulative share" />
  }
}

const comparativeBarData = channelVolume.flatMap((row) => [
  { id: `${row.category}-current`, category: row.category, value: row.value, series: 'Current' },
  { id: `${row.category}-previous`, category: row.category, value: row.previous, series: 'Previous' },
])

export function BarVariantExample({ layout, orientation }: { layout: 'single' | 'grouped' | 'stacked'; orientation: 'vertical' | 'horizontal' }) {
  const common = commonProps(defaultControls, `${layout} ${orientation} bars`, `Compare channel values with a ${layout} ${orientation} bar layout.`)
  if (layout === 'single') {
    return <BarChart {...common} state={chartData(barData)} orientation={orientation} layout="single" categoryLabel="Channel" valueLabel="Completed items" />
  }
  return <BarChart {...common} state={chartData(comparativeBarData)} orientation={orientation} layout={layout} seriesOrder={['Current', 'Previous']} categoryLabel="Channel" valueLabel="Completed items" />
}

export function ChartExample({
  name,
  dataOverride,
  timeAxis,
  ...controls
}: {
  name: ChartName
  dataOverride?: readonly TimeSeriesDatum[]
  timeAxis?: TimeAxisOptions
} & ExampleControls) {
  const details = metadata[name]
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <article className={`catalog-sheet catalog-sheet--${controls.theme}`} style={{ maxWidth: controls.width }}>
        <header className="catalog-sheet__header">
          <div>
            <p className="catalog-index">{name}</p>
            <h2>{details.title}</h2>
            <p>{details.description}</p>
          </div>
          <dl className="catalog-meta">
            <div><dt>Renderer</dt><dd>{controls.renderer}</dd></div>
            <div><dt>Source</dt><dd>Fixed catalog fixture</dd></div>
          </dl>
        </header>
        <div className="catalog-plot">
          <ConcreteChart name={name} controls={controls} lineData={dataOverride} timeAxis={timeAxis} />
        </div>
        <footer className="catalog-sheet__footer">Values, units, and missing-value meaning belong with the chart.</footer>
      </article>
    </ChartProvider>
  )
}

export function RendererComparison() {
  return (
    <div className="catalog-comparison">
      <section aria-label="SVG renderer example"><ChartExample name="ScatterChart" {...defaultControls} renderer="svg" width={620} /><p><b>SVG</b> paints this chart with the package SVG host.</p></section>
      <section aria-label="Canvas renderer example"><ChartExample name="ScatterChart" {...defaultControls} renderer="canvas" width={620} /><p><b>Canvas</b> paints this chart with the package Canvas host. Exact values remain in semantic output.</p></section>
      <aside>The caller selects the renderer. The catalog does not substitute another renderer.</aside>
    </div>
  )
}

export function ExactValueSelectionExample() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <ChartWidget.Root className="catalog-sheet catalog-linked" style={{ maxWidth: 900 }} exactValues="available">
        <ChartWidget.Header className="catalog-sheet__header">
          <div><p className="catalog-index">Integrated disclosure</p><h2>Completed work and exact values</h2><p>The widget toolbar controls the chart-owned semantic table.</p></div>
          <DataTableControl />
        </ChartWidget.Header>
        <ChartWidget.Plot className="catalog-plot">
          <LineChart ariaLabel="Completed work by month" ariaDescription="Monthly completed items." state={chartData(completedSeries)} xLabel="Month" yLabel="Completed items" reference={{ value: 55, label: 'Goal: 55 items' }} />
        </ChartWidget.Plot>
      </ChartWidget.Root>
    </ChartProvider>
  )
}

export function UnavailableExactValueExample() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <ChartWidget.Root className="catalog-sheet" style={{ maxWidth: 900 }} exactValues="unavailable">
        <ChartWidget.Header className="catalog-sheet__header">
          <h2>Loading chart values</h2>
          <DataTableControl />
        </ChartWidget.Header>
        <ChartWidget.Plot className="catalog-plot">
          <LineChart ariaLabel="Loading monthly work" ariaDescription="Monthly work values are loading." state={{ status: 'loading' }} />
        </ChartWidget.Plot>
      </ChartWidget.Root>
    </ChartProvider>
  )
}

export function MonthEndCandlestickExample() {
  const rows = [
    { id: 'jan', date: new Date('2025-01-31T00:00:00Z'), open: 100, high: 108, low: 97, close: 105 },
    { id: 'feb', date: new Date('2025-02-28T00:00:00Z'), open: 105, high: 112, low: 101, close: 109 },
    { id: 'mar', date: new Date('2025-03-31T00:00:00Z'), open: 109, high: 114, low: 104, close: 107 },
  ] as const
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <CandlestickChart
        ariaLabel="Month-end market range"
        ariaDescription="Three monthly candles observed at calendar month end."
        state={chartData(rows)}
        candleInterval={{ unit: 'month', step: 1 }}
        priceLabel="Price (£)"
      />
    </ChartProvider>
  )
}

const timeRangeOptions = [
  { value: '1M', label: '1 month' },
  { value: '3M', label: '3 months' },
  { value: '6M', label: '6 months' },
  { value: 'All', label: 'All' },
] as const

export function FullscreenTimeRangeExample() {
  const targetRef = useRef<HTMLElement>(null)
  const [range, setRange] = useState<(typeof timeRangeOptions)[number]['value']>('6M')
  const count = range === 'All' ? throughputByMonth.length : Number.parseInt(range, 10)
  const visibleRows = queuedSeries.slice(-count)
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <section ref={targetRef} className="catalog-sheet catalog-interaction" style={{ maxWidth: 900 }}>
        <div className="catalog-toolbar">
          <TimeRangeControl value={range} options={timeRangeOptions} onChange={setRange} />
          <FullscreenControl targetRef={targetRef} />
        </div>
        <p className="catalog-selection" role="status">Showing {visibleRows.length} monthly values</p>
        <div className="catalog-plot">
          <AreaChart ariaLabel="Queued work by selected time range" ariaDescription={`${visibleRows.length} monthly queued-work values.`} state={chartData(visibleRows)} xLabel="Month" yLabel="Queued items" />
        </div>
      </section>
    </ChartProvider>
  )
}

export function Guidance() {
  return (
    <section className="catalog-guidance">
      <p className="catalog-index">Agent selection protocol · 01–06</p>
      <h1>Start with the reader task.</h1>
      <ol>
        <li><b>Change:</b> line or area. One result is not a trend.</li>
        <li><b>Compare:</b> bar. Keep a zero baseline when length encodes value.</li>
        <li><b>Relate:</b> scatter. State that association does not prove cause.</li>
        <li><b>Distribute:</b> histogram, box plot, violin, or ECDF. Show the sample meaning.</li>
        <li><b>Part to whole:</b> stacked area or donut only when totals and categories are stable.</li>
        <li><b>Then validate:</b> unit, denominator, source, locale, time zone, missing values, row count, and exact-value access.</li>
      </ol>
      <aside>Select SVG or Canvas only after you verify the package host and equivalent semantic exact-value output.</aside>
    </section>
  )
}

export function StateGallery({ mode }: { mode: 'data' | 'missing' | 'one' | 'responsive' | 'accessibility' | 'renderers' }) {
  if (mode === 'renderers') return <RendererComparison />
  if (mode === 'accessibility') return <ExactValueSelectionExample />
  if (mode === 'responsive') return <ChartExample name="BarChart" {...defaultControls} width={360} />
  if (mode === 'one') return <ChartExample name="LineChart" {...defaultControls} dataOverride={[completedSeries[0]]} state="ready" width={640} />
  if (mode === 'missing') {
    const missing = completedSeries.map((row, index): TimeSeriesDatum => index === 2
      ? { ...row, value: { kind: 'missing', reason: 'No observation was reported.' } }
      : row)
    return <ChartExample name="LineChart" {...defaultControls} dataOverride={missing} width={720} />
  }
  return <div className="catalog-state-grid">{(['loading', 'empty', 'error', 'ready'] as const).map((state) => <ChartExample key={state} name="BarChart" {...defaultControls} state={state} width={560} />)}</div>
}
