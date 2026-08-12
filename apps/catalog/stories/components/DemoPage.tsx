import { useRef, useState, type SVGProps } from 'react'
import {
  BarChart,
  ChartProvider,
  ChartWidget,
  DonutChart,
  ErrorBarChart,
  FullscreenControl,
  HeatmapChart,
  LineChart,
  ScatterChart,
  TimeRangeControl,
  ToggleControl,
  chartData,
  type ApertureIcon,
  type TimeSeriesDatum,
} from '@kevin-courbet/aperture'
import { allocation } from '../../src/fixtures/finance'
import { deliveryIntervals, serviceMatrix } from '../../src/fixtures/operations'
import { relationshipStudy } from '../../src/fixtures/research'

type DemoRange = '3M' | '6M' | 'All'

const rangeOptions = [
  { value: '3M', label: '3 months' },
  { value: '6M', label: '6 months' },
  { value: 'All', label: 'All' },
] as const

const monthlyTeams = [
  { month: '2025-01-01', active: 46 },
  { month: '2025-02-01', active: 51 },
  { month: '2025-03-01', active: 49 },
  { month: '2025-04-01', active: 58 },
  { month: '2025-05-01', active: 62 },
  { month: '2025-06-01', active: 66 },
  { month: '2025-07-01', active: 71 },
  { month: '2025-08-01', active: 69 },
  { month: '2025-09-01', active: 76 },
  { month: '2025-10-01', active: 82 },
  { month: '2025-11-01', active: 87 },
  { month: '2025-12-01', active: 91 },
] as const

const teamSeries = monthlyTeams.map((row): TimeSeriesDatum => ({
  id: row.month,
  date: new Date(`${row.month}T00:00:00Z`),
  value: { kind: 'value', value: row.active },
  series: 'Active teams',
}))

const codeSample = `const [range, setRange] = useState<'3M' | '6M' | 'All'>('6M')
const rows = teamSeries.slice(range === 'All' ? 0 : range === '3M' ? -3 : -6)

<ChartWidget.Root>
  <ChartWidget.Header>
    <h2>Active teams</h2>
  </ChartWidget.Header>
  <ChartWidget.Controls>
    <TimeRangeControl
      value={range}
      options={rangeOptions}
      onChange={setRange}
    />
  </ChartWidget.Controls>
  <ChartWidget.Plot>
    <LineChart
      state={chartData(rows)}
      reference={{ value: 80, label: 'Goal' }}
      ariaLabel="Active teams by month"
      ariaDescription="Monthly active teams. The goal is 80 teams."
    />
  </ChartWidget.Plot>
</ChartWidget.Root>`

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function AlternateCalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 4v3M19 4v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12H4V7a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3M13 13h3M8 16h3" />
    </svg>
  )
}

function CodeSample() {
  const parts = codeSample.split(/(ChartWidget|LineChart|TimeRangeControl|state|reference|ariaLabel)/g)
  return (
    <pre className="demo-code" aria-label="Current TypeScript API example" tabIndex={0}>
      <code>{parts.map((part, index) => (
        <span key={`${part}-${index}`} className={
          /ChartWidget|LineChart|TimeRangeControl/.test(part)
            ? 'demo-code-component'
            : /state|reference|ariaLabel/.test(part)
              ? 'demo-code-prop'
              : undefined
        }>{part}</span>
      ))}</code>
    </pre>
  )
}

function ProductWidget() {
  const [range, setRange] = useState<DemoRange>('6M')
  const [goalVisible, setGoalVisible] = useState(true)
  const frameRef = useRef<HTMLDivElement>(null)
  const rows = range === 'All' ? teamSeries : teamSeries.slice(range === '3M' ? -3 : -6)

  return (
    <ChartWidget.Root className="demo-widget">
      <div ref={frameRef} className="demo-widget-frame">
        <ChartWidget.Header className="demo-widget-header">
          <div>
            <p className="demo-eyebrow">React application example</p>
            <h3>Active teams</h3>
            <p className="demo-reading">91 teams <span>in December</span></p>
          </div>
          <span className="demo-source">Example data</span>
        </ChartWidget.Header>
        <ChartWidget.Controls className="demo-widget-controls">
          <TimeRangeControl value={range} options={rangeOptions} onChange={setRange} />
          <div className="demo-control-cluster">
            <ToggleControl label="Goal" icon={TargetIcon as ApertureIcon} isSelected={goalVisible} onChange={setGoalVisible} />
            <FullscreenControl targetRef={frameRef} />
          </div>
        </ChartWidget.Controls>
        <ChartWidget.Plot className="demo-widget-plot">
          <LineChart
            state={chartData(rows)}
            reference={goalVisible ? { value: 80, label: 'Goal' } : undefined}
            ariaLabel="Active teams by month"
            ariaDescription={goalVisible ? 'Monthly active teams. The goal is 80 teams.' : 'Monthly active teams.'}
            xLabel="Month"
            yLabel="Active teams"
          />
        </ChartWidget.Plot>
        <ChartWidget.Footer className="demo-widget-footer">
          <span><i className="demo-line-key" aria-hidden="true" />Active teams</span>
          {goalVisible ? <span className="demo-goal-key"><i aria-hidden="true" />Goal: 80 teams</span> : null}
          <span>Source: example data</span>
        </ChartWidget.Footer>
      </div>
    </ChartWidget.Root>
  )
}

const galleryLine = teamSeries.slice(-6)
const galleryBars = [
  { id: 'direct', category: 'Direct', value: 184 },
  { id: 'partner', category: 'Partner', value: 132 },
  { id: 'referral', category: 'Referral', value: 96 },
  { id: 'field', category: 'Field', value: 71 },
]
const galleryScatter = relationshipStudy.map((row) => ({ id: row.subject, x: row.effort, y: row.outcome, series: row.group }))
const galleryHeatmap = serviceMatrix.map((row, index) => ({ id: `cell-${index}`, x: row.column, y: row.row, value: row.value }))
const galleryIntervals = deliveryIntervals.map((row, index) => ({ id: `interval-${index}`, category: row.category, estimate: row.value, low: row.low, high: row.high }))
const galleryDonut = allocation.map((row, index) => ({ id: `slice-${index}`, label: row.category, value: row.value }))

function GalleryItem({ index, title, question, children }: { index: string; title: string; question: string; children: React.ReactNode }) {
  return (
    <article className="demo-gallery-item">
      <header><span>{index}</span><div><h3>{title}</h3><p>{question}</p></div></header>
      <div className="demo-gallery-chart">{children}</div>
    </article>
  )
}

function ChartGallery() {
  const common = { height: 230, renderer: 'svg' as const }
  return (
    <div className="demo-gallery">
      <GalleryItem index="01" title="Line" question="How did it change?">
        <LineChart {...common} state={chartData(galleryLine)} xLabel="Month" yLabel="Active teams" ariaLabel="Active teams trend" ariaDescription="Six monthly active-team values." />
      </GalleryItem>
      <GalleryItem index="02" title="Bar" question="Which category is larger?">
        <BarChart {...common} state={chartData(galleryBars)} orientation="horizontal" layout="single" categoryLabel="Channel" valueLabel="Completed items" ariaLabel="Channel comparison" ariaDescription="Completed items by channel." />
      </GalleryItem>
      <GalleryItem index="03" title="Scatter" question="How are two measures related?">
        <ScatterChart {...common} state={chartData(galleryScatter)} xLabel="Effort (hours)" yLabel="Outcome score" ariaLabel="Effort and outcome" ariaDescription="Outcome score by effort in hours and study group." />
      </GalleryItem>
      <GalleryItem index="04" title="Donut" question="What is the share of a total?">
        <DonutChart {...common} state={chartData(galleryDonut)} ariaLabel="Allocation share" ariaDescription="Percentage allocation share by work category." />
      </GalleryItem>
      <GalleryItem index="05" title="Heatmap" question="Where are values high or low?">
        <HeatmapChart {...common} state={chartData(galleryHeatmap)} colorDomain={[0, 100]} xLabel="Weekday" yLabel="Service" ariaLabel="Service matrix" ariaDescription="Service scores out of 100 by weekday." />
      </GalleryItem>
      <GalleryItem index="06" title="Error bar" question="How uncertain is the estimate?">
        <ErrorBarChart {...common} state={chartData(galleryIntervals)} categoryLabel="Region" valueLabel="Duration (days)" ariaLabel="Delivery intervals" ariaDescription="Estimated delivery duration and its low and high values by region, in days." />
      </GalleryItem>
      <p className="demo-gallery-source">Source: example data. Donut values are percentages. Service scores use a 0 to 100 scale.</p>
    </div>
  )
}

function ThemeIntegration() {
  const [range, setRange] = useState<DemoRange>('6M')
  const rows = range === 'All' ? teamSeries : teamSeries.slice(range === '3M' ? -3 : -6)

  return (
    <div className="demo-theme-grid">
      <div className="demo-token-panel">
        <p className="demo-panel-label">Application token map</p>
        <div><i className="demo-swatch demo-swatch-ink" /><code>--aperture-color-text</code><span>#13243A</span></div>
        <div><i className="demo-swatch demo-swatch-line" /><code>--aperture-chart-1</code><span>#1769C2</span></div>
        <div><i className="demo-swatch demo-swatch-goal" /><code>--aperture-color-accent</code><span>#765000</span></div>
        <p>The host can replace semantic tokens and one icon without changing chart code.</p>
      </div>
      <div className="demo-theme-preview">
        <ChartProvider icons={{ calendar: AlternateCalendarIcon }}>
          <ChartWidget.Root className="demo-theme-widget">
            <ChartWidget.Controls>
              <TimeRangeControl value={range} options={rangeOptions} onChange={setRange} />
            </ChartWidget.Controls>
            <ChartWidget.Plot>
              <LineChart
                className="demo-theme-chart"
                state={chartData(rows)}
                reference={{ value: 80, label: 'Goal' }}
                ariaLabel="Host-themed active teams"
                ariaDescription="The host overrides Aperture semantic color and type tokens."
                xLabel="Month"
                yLabel="Active teams"
                height={270}
              />
            </ChartWidget.Plot>
          </ChartWidget.Root>
        </ChartProvider>
      </div>
      <pre className="demo-token-code"><code>{`.product-chart {
  --aperture-font-family: var(--font-sans);
  --aperture-color-text: #13243a;
  --aperture-chart-1: #1769c2;
  --aperture-color-accent: #765000;
}`}</code></pre>
    </div>
  )
}

export function DemoPage() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <main className="demo-page">
        <header className="demo-hero">
          <div className="demo-kicker"><span>Aperture</span> React chart design system</div>
          <h1>One chart API.<br /><em>Accurate by default.</em></h1>
          <p>Typed React charts with accessible exact values, explicit controls, and one visual language for applications and standalone pages.</p>
          <div className="demo-meta"><span>React 19 and TypeScript</span><span>TanStack Charts 0.11.1</span><span>SVG and Canvas</span></div>
        </header>

        <section className="demo-section" aria-labelledby="demo-widget-heading">
          <div className="demo-section-intro">
            <p className="demo-eyebrow">Developer use</p>
            <h2 id="demo-widget-heading">Add only the controls that the reader needs.</h2>
            <p>The application owns data and controlled state. Aperture owns chart presentation, focus, exact values, and accessible interaction.</p>
          </div>
          <div className="demo-product-grid"><ProductWidget /><CodeSample /></div>
        </section>

        <section className="demo-section" aria-labelledby="demo-gallery-heading">
          <div className="demo-section-intro">
            <p className="demo-eyebrow">Chart families</p>
            <h2 id="demo-gallery-heading">Start with the question.</h2>
            <p>These six families show the main adoption path. The technical catalog contains all 27 components, variants, states, and interactions.</p>
          </div>
          <ChartGallery />
        </section>

        <section className="demo-section" aria-labelledby="demo-theme-heading">
          <div className="demo-section-intro">
            <p className="demo-eyebrow">Application integration</p>
            <h2 id="demo-theme-heading">Match the host design system.</h2>
            <p>Override semantic variables and replace icons. Aperture keeps its accessibility and chart-rendering behavior.</p>
          </div>
          <ThemeIntegration />
        </section>

        <footer className="demo-footer"><span>Aperture chart design system</span><span>Adopter overview · 2026</span></footer>
      </main>
    </ChartProvider>
  )
}
