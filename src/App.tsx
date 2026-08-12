import { useRef, useState } from 'react'
import { Check, Code2, Diamond, Palette } from 'lucide-react'
import {
  ChartProvider,
  ChartWidget,
  DataTableControl,
  ExactValueTable,
  FullscreenControl,
  LineChart,
  TimeRangeControl,
  ToggleControl,
  englishMessages,
  readyChartData,
  useChartConfig,
} from './library'
import type { IconSet, TimeRange } from './library'
import './styles.css'

type TeamDatum = { month: string; active: number }

const monthlyTeams: readonly TeamDatum[] = [
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
]

const teamFormatter = {
  kind: 'number',
  maximumFractionDigits: 0,
  unit: 'teams',
} as const

const codeSample = `const [range, setRange] = useState<TimeRange>('6M')
const state = readyChartData(filteredRows)

<ChartWidget.Root>
  <ChartWidget.Header>Active teams</ChartWidget.Header>
  <ChartWidget.Controls>
    <TimeRangeControl value={range} onChange={setRange} />
    <DataTableControl />
  </ChartWidget.Controls>
  <ChartWidget.Plot>
    <LineChart<TeamDatum>
      state={state}
      x={(row) => new Date(row.month)}
      y={(row) => row.active}
      goal={{ value: 80, label: 'Goal' }}
      formatter={{ kind: 'number', unit: 'teams' }}
      ariaLabel="Active teams by month"
      ariaDescription="Monthly active teams. The goal is 80 teams."
    />
  </ChartWidget.Plot>
  <ChartWidget.TableRegion>
    <ExactValueTable
      state={state}
      x={(row) => new Date(row.month)}
      y={(row) => row.active}
      goal={{ value: 80, label: 'Goal' }}
      formatter={{ kind: 'number', unit: 'teams' }}
      caption="Exact values"
    />
  </ChartWidget.TableRegion>
</ChartWidget.Root>`

function CodeSample() {
  const parts = codeSample.split(
    /(ChartWidget|LineChart|TimeRangeControl|DataTableControl|state|goal|formatter)/g,
  )

  return (
    <pre className="code-sample" aria-label="TypeScript API example">
      <code>
        {parts.map((part, index) => (
          <span
            key={index}
            className={
              /ChartWidget|LineChart|TimeRangeControl|DataTableControl/.test(part)
                ? 'code-component'
                : /state|goal|formatter/.test(part)
                  ? 'code-prop'
                  : undefined
            }
          >
            {part}
          </span>
        ))}
      </code>
    </pre>
  )
}

function ProductWidget() {
  const [range, setRange] = useState<TimeRange>('6M')
  const [goalVisible, setGoalVisible] = useState(true)
  const frameRef = useRef<HTMLDivElement>(null)
  const { icons, messages } = useChartConfig()
  const filteredRows =
    range === 'All'
      ? monthlyTeams
      : monthlyTeams.slice(range === '1M' ? -1 : range === '3M' ? -3 : -6)
  const state = readyChartData(filteredRows)
  const goal = goalVisible ? { value: 80, label: 'Goal' } : undefined

  return (
    <ChartWidget.Root className="product-widget">
      <div ref={frameRef} className="widget-frame">
        <ChartWidget.Header>
          <div>
            <p className="eyebrow">React application example</p>
            <h3>Active teams</h3>
            <p className="widget-summary">
              91 teams <span>in December</span>
            </p>
          </div>
          <span className="source-badge">Example data</span>
        </ChartWidget.Header>
        <ChartWidget.Controls>
          <TimeRangeControl value={range} onChange={setRange} />
          <div className="control-cluster">
            <ToggleControl
              label={messages.controls.goal}
              icon={icons.target}
              isSelected={goalVisible}
              onChange={setGoalVisible}
            />
            <DataTableControl />
            <FullscreenControl targetRef={frameRef} />
          </div>
        </ChartWidget.Controls>
        <ChartWidget.Plot>
          <LineChart
            state={state}
            x={(row) => new Date(row.month)}
            y={(row) => row.active}
            goal={goal}
            formatter={teamFormatter}
            ariaLabel="Active teams by month"
            ariaDescription={goal ? 'Monthly active teams. The goal is 80 teams.' : 'Monthly active teams.'}
            seriesLabel="Active teams"
          />
        </ChartWidget.Plot>
        <ChartWidget.Footer>
          <span>
            <span className="legend-line" aria-hidden="true" />
            Active teams
          </span>
          {goal ? (
            <span className="legend-target">
              <span className="target-dash" aria-hidden="true" />
              Goal: 80 teams
            </span>
          ) : null}
          <span>Source: example data</span>
        </ChartWidget.Footer>
        <ChartWidget.TableRegion>
          <ExactValueTable
            state={state}
            x={(row) => new Date(row.month)}
            y={(row) => row.active}
            goal={goal}
            formatter={teamFormatter}
            caption={messages.dataTable.caption}
          />
        </ChartWidget.TableRegion>
      </div>
    </ChartWidget.Root>
  )
}

type CheckDatum = { stage: string; rate: number }

const checkX = (row: CheckDatum) =>
  new Date(row.stage === 'Baseline' ? '2025-01-01' : '2025-02-01')

function OneOffExamples() {
  const comparison = readyChartData<CheckDatum>([
    { stage: 'Baseline', rate: 90.5 },
    { stage: 'Revised method', rate: 100 },
  ])
  const finalCheck = readyChartData<CheckDatum>([
    { stage: 'Final check · 21/21', rate: 100 },
  ])
  const goal = { value: 1, label: 'Goal' }
  const formatter = { kind: 'percent', maximumFractionDigits: 1 } as const

  return (
    <section className="report-section" aria-labelledby="report-heading">
      <div className="section-intro">
        <p className="eyebrow">Standalone page example</p>
        <h2 id="report-heading">Show the result without a dashboard layout.</h2>
        <p>Apply Aperture accessibility, data display, and interaction requirements to a standalone page.</p>
      </div>
      <div className="report-grid">
        <ChartWidget.Root className="report-widget">
          <ChartWidget.Header>
            <div>
              <p className="eyebrow">Validation pass rate</p>
              <h3>Before and after the method change</h3>
            </div>
            <span className="source-badge">Example data</span>
          </ChartWidget.Header>
          <ChartWidget.Plot>
            <LineChart
              state={comparison}
              x={checkX}
              xLabel={(row) => row.stage}
              y={(row) => row.rate / 100}
              goal={goal}
              formatter={formatter}
              ariaLabel="Validation pass rate"
              ariaDescription="Two pass rates. The pass rate increases from 19 of 21 to 21 of 21."
              seriesLabel="Pass rate"
              height={250}
            />
          </ChartWidget.Plot>
          <div className="report-callout">
            <strong>19/21 → 21/21</strong>
            <span>90.5% → 100%</span>
          </div>
          <ChartWidget.Controls>
            <DataTableControl />
          </ChartWidget.Controls>
          <ChartWidget.TableRegion>
            <ExactValueTable
              state={comparison}
              x={checkX}
              xLabel={(row) => row.stage}
              y={(row) => row.rate / 100}
              goal={goal}
              formatter={formatter}
              caption="Exact pass rates"
            />
          </ChartWidget.TableRegion>
          <ChartWidget.Footer>
            <span>Source: example data</span>
            <span>Sample: 21 records</span>
          </ChartWidget.Footer>
        </ChartWidget.Root>
        <ChartWidget.Root className="report-widget single-observation">
          <ChartWidget.Header>
            <div>
              <p className="eyebrow">Validation pass rate</p>
              <h3>After the method change</h3>
            </div>
            <span className="source-badge">Example data</span>
          </ChartWidget.Header>
          <ChartWidget.Plot>
            <LineChart
              state={finalCheck}
              x={() => new Date('2025-02-01')}
              xLabel={(row) => row.stage}
              y={(row) => row.rate / 100}
              goal={goal}
              formatter={formatter}
              ariaLabel="Final validation pass rate"
              ariaDescription="One pass rate. All 21 records pass. No trend line is shown."
            />
          </ChartWidget.Plot>
          <ChartWidget.Controls>
            <DataTableControl />
          </ChartWidget.Controls>
          <ChartWidget.TableRegion>
            <ExactValueTable
              state={finalCheck}
              x={() => new Date('2025-02-01')}
              xLabel={(row) => row.stage}
              y={(row) => row.rate / 100}
              goal={goal}
              formatter={formatter}
              caption="Exact pass rate"
            />
          </ChartWidget.TableRegion>
          <ChartWidget.Footer>
            <span>Source: example data</span>
            <span>Sample: 21 records</span>
          </ChartWidget.Footer>
        </ChartWidget.Root>
      </div>
    </section>
  )
}

const alternateIcons: Partial<IconSet> = { target: Diamond }

function IconDemo() {
  const [selected, setSelected] = useState(true)
  const { icons } = useChartConfig()

  return (
    <ChartWidget.Root className="icon-demo">
      <ChartWidget.Header>
        <div>
          <p className="eyebrow">Icon provider</p>
          <h3>Use a different icon</h3>
        </div>
      </ChartWidget.Header>
      <ChartWidget.Controls>
        <ToggleControl
          label="Custom goal icon"
          icon={icons.target}
          isSelected={selected}
          onChange={setSelected}
        />
      </ChartWidget.Controls>
    </ChartWidget.Root>
  )
}

function ThemeSection() {
  return (
    <section className="theme-section" aria-labelledby="theme-heading">
      <div className="section-intro">
        <p className="eyebrow">Application integration</p>
        <h2 id="theme-heading">Match the application design system.</h2>
        <p>Use semantic variables for the theme. Use public layout regions for structure. Aperture controls chart focus, tooltips, and chart rendering.</p>
      </div>
      <div className="theme-columns">
        <div className="theme-demo">
          <div className="theme-demo-label">
            <Palette size={16} /> Application token map
          </div>
          <div className="token-row">
            <span className="swatch navy" />
            <code>--chart-ink</code>
            <b>#13243A</b>
          </div>
          <div className="token-row">
            <span className="swatch blue" />
            <code>--chart-line</code>
            <b>#1769C2</b>
          </div>
          <div className="token-row">
            <span className="swatch gold" />
            <code>--chart-target</code>
            <b>#B57900</b>
          </div>
          <p className="mapping-note">The application can replace one icon or the full icon set.</p>
          <ChartProvider
            locale="en-GB"
            timeZone="Europe/London"
            messages={englishMessages}
            icons={alternateIcons}
          >
            <IconDemo />
          </ChartProvider>
        </div>
        <div className="snippets">
          <div>
            <span className="snippet-label">Tailwind and shadcn</span>
            <pre>{`@theme {
  --color-chart-ink: var(--chart-ink);
  --color-chart-line: var(--chart-line);
  --color-chart-target: var(--chart-target);
}`}</pre>
          </div>
          <div>
            <span className="snippet-label">StyleX</span>
            <pre>{`const vars = stylex.defineVars({
  ink: 'var(--chart-ink)',
  line: 'var(--chart-line)',
  target: 'var(--chart-target)',
})`}</pre>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <ChartProvider locale="en-GB" timeZone="Europe/London" messages={englishMessages}>
      <main>
        <header className="catalog-header">
          <div className="kicker">
            <Code2 size={16} /> Design validation <span className="product-tag">Aperture</span>
          </div>
          <h1>
            One chart API.
            <br />
            <em>React applications and standalone pages.</em>
          </h1>
          <p className="lede">
            Use the same typed components in a React application and a standalone page.
          </p>
          <div className="header-meta">
            <span><Check size={15} /> React 19 and TypeScript</span>
            <span><Check size={15} /> TanStack Charts 0.11.1</span>
            <span><Check size={15} /> Exact values</span>
          </div>
        </header>
        <section className="developer-section" aria-labelledby="developer-heading">
          <div className="section-intro">
            <p className="eyebrow">Developer use</p>
            <h2 id="developer-heading">Add only the controls that you need.</h2>
            <p>If you remove a control component, Aperture does not show that control. The application manages the time range and the data.</p>
          </div>
          <div className="developer-grid">
            <ProductWidget />
            <CodeSample />
          </div>
        </section>
        <OneOffExamples />
        <ThemeSection />
        <footer className="catalog-footer">
          <span>Aperture chart design system</span>
          <span>Validation catalog · 2026</span>
        </footer>
      </main>
    </ChartProvider>
  )
}
