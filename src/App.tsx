import { useRef, useState } from 'react'
import { Check, Code2, Palette, Sparkles } from 'lucide-react'
import { ChartProvider, ChartWidget, DataTableControl, ExactValueTable, FullscreenControl, LineChart, TimeRangeControl, ToggleControl, frenchMessages, useChartConfig } from './library'
import { readyChartData } from './library'
import type { IconSet, TimeRange } from './library'
import './styles.css'

type ProspectDatum = { month: string; qualified: number }
const monthlyProspects: readonly ProspectDatum[] = [
  { month: '2025-01-01', qualified: 46 }, { month: '2025-02-01', qualified: 51 }, { month: '2025-03-01', qualified: 49 },
  { month: '2025-04-01', qualified: 58 }, { month: '2025-05-01', qualified: 62 }, { month: '2025-06-01', qualified: 66 },
  { month: '2025-07-01', qualified: 71 }, { month: '2025-08-01', qualified: 69 }, { month: '2025-09-01', qualified: 76 },
  { month: '2025-10-01', qualified: 82 }, { month: '2025-11-01', qualified: 87 }, { month: '2025-12-01', qualified: 91 },
]
const metricFormatter = { kind: 'number', maximumFractionDigits: 0, unit: 'prospects' } as const
const codeSample = `const [range, setRange] = useState<TimeRange>('6M')
const state = readyChartData(filteredRows)

<ChartWidget.Root slotClassNames={{ plot: 'product-chart' }}>
  <ChartWidget.Header>Qualified prospects</ChartWidget.Header>
  <ChartWidget.Controls>
    <TimeRangeControl value={range} onChange={setRange} />
    <DataTableControl />
  </ChartWidget.Controls>
  <ChartWidget.Plot>
    <LineChart<ProspectDatum>
      state={state}
      x={(row) => new Date(row.month)}
      y={(row) => row.qualified}
      goal={{ value: 80, label: 'Objectif' }}
      formatter={{ kind: 'number', unit: 'prospects' }}
      ariaLabel="Prospects qualifiés par mois"
      ariaDescription="Série mensuelle avec un objectif à 80."
    />
  </ChartWidget.Plot>
  <ChartWidget.TableRegion>
    <ExactValueTable
      state={state}
      x={(row) => new Date(row.month)}
      y={(row) => row.qualified}
      goal={{ value: 80, label: 'Objectif' }}
      formatter={{ kind: 'number', unit: 'prospects' }}
      caption="Valeurs exactes"
    />
  </ChartWidget.TableRegion>
</ChartWidget.Root>`

function CodeSample() {
  return <pre className="code-sample" aria-label="TypeScript API example"><code>{codeSample.split(/(ChartWidget|LineChart|TimeRangeControl|DataTableControl|state|target|formatter)/g).map((part, index) => <span key={index} className={/ChartWidget|LineChart|TimeRangeControl|DataTableControl/.test(part) ? 'code-component' : /state|target|formatter/.test(part) ? 'code-prop' : undefined}>{part}</span>)}</code></pre>
}

function ProductWidget() {
  const [range, setRange] = useState<TimeRange>('6M')
  const [goalVisible, setGoalVisible] = useState(true)
  const frameRef = useRef<HTMLDivElement>(null)
  const { icons, messages } = useChartConfig()
  const filteredRows = range === 'All' ? monthlyProspects : monthlyProspects.slice(range === '1M' ? -1 : range === '3M' ? -3 : -6)
  const filteredState = readyChartData(filteredRows)
  return <ChartWidget.Root className="product-widget" slotClassNames={{ plot: 'product-chart', footer: 'product-footer' }}>
    <div ref={frameRef} className="widget-frame">
      <ChartWidget.Header><div><p className="eyebrow">Récurrent · Prospection</p><h3>Prospects qualifiés</h3><p className="widget-summary">91 <span>en décembre</span> · +18% sur 12 mois</p></div><span className="source-badge">Données illustratives</span></ChartWidget.Header>
      <ChartWidget.Controls><TimeRangeControl value={range} onChange={setRange} /><div className="control-cluster"><ToggleControl label={messages.controls.goal} icon={icons.target} isSelected={goalVisible} onChange={setGoalVisible} /><DataTableControl /><FullscreenControl targetRef={frameRef} /></div></ChartWidget.Controls>
      <ChartWidget.Plot><LineChart state={filteredState} x={(row) => new Date(row.month)} y={(row) => row.qualified} goal={goalVisible ? { value: 80, label: 'Objectif' } : undefined} formatter={metricFormatter} ariaLabel="Prospects qualifiés par mois" ariaDescription="Série mensuelle de prospects qualifiés, avec une ligne d'objectif à 80 prospects." seriesLabel="Prospects qualifiés" /></ChartWidget.Plot>
      <ChartWidget.Footer><span><span className="legend-line" aria-hidden="true" />Prospects qualifiés</span>{goalVisible ? <span className="legend-target"><span className="target-dash" aria-hidden="true" />Objectif 80</span> : null}<span>Source&nbsp;: jeu de démonstration illustratif</span></ChartWidget.Footer>
      <ChartWidget.TableRegion><ExactValueTable state={filteredState} x={(row) => new Date(row.month)} y={(row) => row.qualified} goal={goalVisible ? { value: 80, label: 'Objectif' } : undefined} formatter={metricFormatter} caption={messages.dataTable.caption} /></ChartWidget.TableRegion>
    </div>
  </ChartWidget.Root>
}

function ResearchReport() {
  const researchState = readyChartData([{ stage: 'Référence', rate: 90.5 }, { stage: 'Identité téléphonique', rate: 100 }])
  const finalState = readyChartData([{ stage: 'Résultat final WF-60 · 21/21', rate: 100 }])
  const researchX = (row: { stage: string; rate: number }) => new Date(row.stage === 'Référence' ? '2025-01-01' : '2025-02-01')
  return <section className="research-section" aria-labelledby="research-heading">
    <div className="section-intro"><p className="eyebrow">One-off context · Research report</p><h2 id="research-heading">A good report chart does not need to pretend it is a product dashboard.</h2><p>These two views use the same provider, data states, exact-value access, and target language. They validate a chart system across a recurring product and a one-off research context.</p></div>
    <div className="report-grid">
      <ChartWidget.Root className="report-widget">
        <ChartWidget.Header><div><p className="eyebrow">WF-10 · identity resolution</p><h3>Baseline to phone identity</h3></div><span className="source-badge">Illustrative report data</span></ChartWidget.Header>
        <ChartWidget.Plot><LineChart state={researchState} x={researchX} xLabel={(row) => row.stage} y={(row) => row.rate / 100} goal={{ value: 1, label: 'Objectif' }} formatter={{ kind: 'percent', maximumFractionDigits: 1 }} ariaLabel="Résolution d'identité WF-10" ariaDescription="Deux observations : 19 sur 21, soit 90,5 pour cent, puis 21 sur 21, soit 100 pour cent." seriesLabel="Rappel" /></ChartWidget.Plot>
        <div className="report-callout"><strong>19/21 <span>→</span> 21/21</strong><span>90,5&nbsp;% → 100&nbsp;% · dénominateur visible</span></div>
        <ChartWidget.Controls><DataTableControl /></ChartWidget.Controls>
        <ChartWidget.TableRegion><ExactValueTable state={researchState} x={researchX} xLabel={(row) => row.stage} y={(row) => row.rate / 100} goal={{ value: 1, label: 'Objectif' }} formatter={{ kind: 'percent', maximumFractionDigits: 1 }} caption="Valeurs exactes WF-10 · 21 dossiers" /></ChartWidget.TableRegion>
        <ChartWidget.Footer><span>Source&nbsp;: recherche PVCP illustrative</span><span>n = 21</span></ChartWidget.Footer>
      </ChartWidget.Root>
      <ChartWidget.Root className="report-widget single-observation">
        <ChartWidget.Header><div><p className="eyebrow">WF-60 · final observation</p><h3>Final identity resolution</h3></div><span className="source-badge">Illustrative report data</span></ChartWidget.Header>
        <ChartWidget.Plot><LineChart state={finalState} x={() => new Date('2025-02-01')} xLabel={(row) => row.stage} y={(row) => row.rate / 100} goal={{ value: 1, label: 'Objectif' }} formatter={{ kind: 'percent', maximumFractionDigits: 1 }} ariaLabel="Résultat final WF-60" ariaDescription="Une observation, 21 dossiers sur 21 résolus, soit 100 pour cent. Aucune tendance n'est dessinée." /></ChartWidget.Plot>
        <ChartWidget.Controls><DataTableControl /></ChartWidget.Controls>
        <ChartWidget.TableRegion><ExactValueTable state={finalState} x={() => new Date('2025-02-01')} xLabel={(row) => row.stage} y={(row) => row.rate / 100} goal={{ value: 1, label: 'Objectif' }} formatter={{ kind: 'percent', maximumFractionDigits: 1 }} caption="Valeur exacte WF-60 · 21 dossiers" /></ChartWidget.TableRegion>
        <ChartWidget.Footer><span>Source&nbsp;: recherche PVCP illustrative</span><span>n = 21</span></ChartWidget.Footer>
      </ChartWidget.Root>
    </div>
  </section>
}

const alternateIcons: Partial<IconSet> = { fullscreen: Sparkles }
function ThemeSection() {
  return <section className="theme-section" aria-labelledby="theme-heading">
    <div className="section-intro"><p className="eyebrow">Integration surface</p><h2 id="theme-heading">Bring the system into the host, not the other way around.</h2><p>Semantic variables keep the chart neutral to the product design system. Structural slots accept className, style, and slotClassNames without requiring a utility framework.</p></div>
    <div className="theme-columns">
      <div className="theme-demo"><div className="theme-demo-label"><Palette size={16} /> Host token mapping</div><div className="token-row"><span className="swatch navy" /><code>--chart-ink</code><b>#13243A</b></div><div className="token-row"><span className="swatch blue" /><code>--chart-line</code><b>#1769C2</b></div><div className="token-row"><span className="swatch gold" /><code>--chart-target</code><b>#B57900</b></div><p className="mapping-note">Try the alternate icon provider below. It proves the public contract is not coupled to Lucide.</p><ChartProvider locale="fr-FR" timeZone="Europe/Paris" messages={frenchMessages} icons={alternateIcons}><ChartWidget.Root className="icon-demo"><ChartWidget.Header><div><p className="eyebrow">IconSet provider</p><h3>Replace one icon</h3></div></ChartWidget.Header><ChartWidget.Controls><FullscreenControl targetRef={{ current: null }} /></ChartWidget.Controls></ChartWidget.Root></ChartProvider></div>
      <div className="snippets"><div><span className="snippet-label">Tailwind / shadcn mapping</span><pre>{`@theme {
  --color-chart-ink: var(--chart-ink);
  --color-chart-line: var(--chart-line);
  --color-chart-target: var(--chart-target);
}`}</pre></div><div><span className="snippet-label">StyleX variable mapping</span><pre>{`const vars = stylex.defineVars({
  ink: 'var(--chart-ink)',
  line: 'var(--chart-line)',
  target: 'var(--chart-target)',
})`}</pre></div></div>
    </div>
  </section>
}

export default function App() {
  return <ChartProvider locale="fr-FR" timeZone="Europe/Paris" messages={frenchMessages}><main><header className="catalog-header"><div className="kicker"><Code2 size={16} /> Developer catalog <span className="product-tag">Aperture</span></div><h1>One chart system.<br /><em>Two kinds of trust.</em></h1><p className="lede">This validates one opinionated React chart system across product and one-off contexts — so developers can inspect the live UX, and business users can read the evidence without translation.</p><div className="header-meta"><span><Check size={15} /> React 19 + strict TypeScript</span><span><Check size={15} /> TanStack Charts 0.11.1</span><span><Check size={15} /> Accessible exact values</span></div></header><section className="developer-section" aria-labelledby="developer-heading"><div className="section-intro"><p className="eyebrow">01 · Developer experience</p><h2 id="developer-heading">A recurring widget with an API you can read.</h2><p>The composition is the feature contract. Remove <code>DataTableControl</code>, and this widget has no table toggle. The host owns the range and filtered data.</p></div><div className="developer-grid"><ProductWidget /><CodeSample /></div></section><ResearchReport /><ThemeSection /><footer className="catalog-footer"><span>Aperture chart design system.</span><span>Validation catalog · 2026</span></footer></main></ChartProvider>
}
