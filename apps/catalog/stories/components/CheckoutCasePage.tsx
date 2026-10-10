import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActiveFilters,
  BarChart,
  ChartProvider,
  ChartToolbar,
  ChartWidget,
  DumbbellChart,
  FilterBar,
  FullscreenControl,
  HeatmapChart,
  LineChart,
  SelectControl,
  Sparkline,
  StatTile,
  StackedAreaChart,
  TimeRangeControl,
  chartData,
  createCrossFilter,
  type ApertureChartStyle,
  type CategoryHighlight,
  type CellHighlight,
  type DumbbellDatum,
  type HeatmapDatum,
  type HorizontalBarDatum,
  type NumericPoint,
  type SeriesBarDatum,
  type SparklineDatum,
  type StackedAreaDatum,
  type TimeHighlight,
  type TimeSeriesDatum,
} from '@kevin-courbet/aperture'
import { checkoutDevices, checkoutEvents, checkoutRegions, checkoutSource } from '../../src/fixtures/checkout'
import {
  allSlice,
  buildTotals,
  conversion,
  dailyTotals,
  difference,
  failureShare,
  isFiltered,
  ordersPerDay,
  share,
  shippingShare,
  sliceAllLabels,
  sliceDimensions,
  sliceFromFilters,
  sliceLabel,
  sliceLabels,
  sliceOptions,
  submittedShare,
  timeoutShareOfCards,
  windowTotals,
  windows,
  withSliceValue,
  type Slice,
  type SliceDimension,
  type Totals,
} from './checkout-analysis'

const percentFormat = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const integerFormat = new Intl.NumberFormat('en-GB')

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${percentFormat.format(value)}%`
}

function formatPoints(value: number | null): string {
  return value === null ? '—' : `${value > 0 ? '+' : ''}${percentFormat.format(value)} pp`
}

function utcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function point(value: number | null): NumericPoint {
  return value === null ? { kind: 'missing', reason: 'No checkouts were recorded on this day.' } : { kind: 'value', value }
}

const percentFormatters = {
  axisNumber: (value: number) => `${value}%`,
  number: (value: number) => `${percentFormat.format(value)}%`,
}

const pointFormatters = {
  axisNumber: (value: number) => `${value > 0 ? '+' : ''}${value}`,
  number: (value: number) => `${value > 0 ? '+' : ''}${percentFormat.format(value)}`,
}

/* The earlier window is context and the incident window carries the accent.
   The host maps series to roles with tokens at the composition boundary. */
const windowSeriesStyle: ApertureChartStyle = {
  '--aperture-chart-1': 'var(--aperture-chart-context)',
  '--aperture-chart-2': 'var(--aperture-color-accent)',
}

const contextSeriesStyle: ApertureChartStyle = { '--aperture-chart-2': 'var(--aperture-chart-context)' }

type TrendRange = 'all' | 'september' | 'incident'

const trendRangeOptions = [
  { value: 'all', label: 'All 6 weeks' },
  { value: 'september', label: 'From 1 Sep' },
  { value: 'incident', label: 'From 8 Sep' },
] as const

const trendRangeStart: Record<TrendRange, string> = { all: '2026-08-17', september: '2026-09-01', incident: '2026-09-08' }

const incidentHighlight: TimeHighlight = {
  kind: 'range',
  start: utcDate(windows.incident.start),
  end: utcDate(windows.incident.end),
  label: 'Incident window',
}

const eventHighlights: readonly TimeHighlight[] = checkoutEvents.map((event): TimeHighlight => ({
  kind: 'event',
  date: utcDate(event.date),
  label: event.label,
}))

const failureReasons = ['3-D Secure timeout', 'Issuer declined', 'Gateway error'] as const
const funnelSteps = ['Checkout started', 'Shipping completed', 'Payment submitted', 'Order confirmed'] as const

// One filter group for the page. Widgets read it from context instead of props.
const caseFilters = createCrossFilter<SliceDimension>('CaseFilters')

function useSlice(): Slice {
  return sliceFromFilters(caseFilters.useFilters().values)
}

function nonEmpty<TItem>(items: readonly TItem[]): readonly [TItem, ...TItem[]] {
  const [first, ...rest] = items
  if (first === undefined) throw new RangeError('Filter options must not be empty.')
  return [first, ...rest]
}

function Widget({
  title,
  note,
  controls,
  footer,
  children,
}: {
  readonly title: string
  readonly note: string
  readonly controls?: ReactNode
  readonly footer?: ReactNode
  readonly children: ReactNode
}) {
  const targetRef = useRef<HTMLElement>(null)
  return (
    <ChartWidget.Root ref={targetRef} className="case-widget" exactValues="available">
      <ChartWidget.Header className="case-widget-header">
        <h2>{title}</h2>
        <p className="case-note">{note}</p>
      </ChartWidget.Header>
      {controls === undefined
        ? <ChartToolbar targetRef={targetRef} />
        : (
          <ChartWidget.Controls className="case-widget-controls">
            {controls}
            <FullscreenControl targetRef={targetRef} />
          </ChartWidget.Controls>
        )}
      <ChartWidget.Plot>{children}</ChartWidget.Plot>
      {footer === undefined ? null : <ChartWidget.Footer className="case-widget-footer">{footer}</ChartWidget.Footer>}
    </ChartWidget.Root>
  )
}

function PageFilters() {
  const filters = caseFilters.useFilters()
  return (
    <FilterBar className="case-filters">
      {sliceDimensions.map((dimension) => (
        <SelectControl
          key={dimension}
          label={sliceLabels[dimension]}
          value={filters.values[dimension]}
          allLabel={sliceAllLabels[dimension]}
          options={nonEmpty(sliceOptions[dimension].map((value: string) => ({ value, label: value })))}
          onChange={(value) => filters.set(dimension, value)}
        />
      ))}
      <ActiveFilters filters={filters} labels={sliceLabels} />
    </FilterBar>
  )
}

function dailySeries(slice: Slice, measure: (totals: Totals) => number | null): SparklineDatum[] {
  return dailyTotals(slice).map((day) => ({ id: day.date, date: utcDate(day.date), value: point(measure(day.totals)) }))
}

const incidentStart = utcDate(windows.incident.start)
const pointsDelta = (delta: number) => `${percentFormat.format(delta)} pp`

function KpiRow({ slice, before, incident, hotfix }: { readonly slice: Slice; readonly before: Totals; readonly incident: Totals; readonly hotfix: Totals }) {
  const tile = (value: number | null, comparison: number | null) => value === null
    ? { status: 'empty' as const, message: 'No checkouts in this slice.' }
    : { status: 'ready' as const, datum: { value, comparison: comparison === null ? undefined : { value: comparison, label: `vs ${windows.before.label}` } } }
  const trend = (label: string, measure: (totals: Totals) => number | null, formatters?: { number: (value: number) => string }) => (
    <Sparkline state={chartData(dailySeries(slice, measure))} ariaLabel={label} accentFrom={incidentStart} highlights={[incidentHighlight]} formatters={formatters} />
  )
  return (
    <section className="case-tiles" aria-label={`Headline figures, ${windows.incident.label}`}>
      <StatTile
        label={`Checkout conversion · ${windows.incident.label}`}
        state={tile(conversion(incident), conversion(before))}
        format={(value) => percentFormat.format(value)}
        unit="%"
        goodDirection="increase"
        formatDelta={pointsDelta}
        trend={trend('Daily checkout conversion', conversion, percentFormatters)}
        note={`Since hotfix 22 Sep: ${formatPercent(conversion(hotfix))}`}
      />
      <StatTile
        label={`Orders per day · ${windows.incident.label}`}
        state={tile(ordersPerDay(incident, 'incident'), ordersPerDay(before, 'before'))}
        format={(value) => integerFormat.format(value)}
        goodDirection="increase"
        formatDelta={(delta) => `${integerFormat.format(delta)} per day`}
        trend={trend('Daily orders', (totals) => totals.orders)}
        note={`Since hotfix 22 Sep: ${integerFormat.format(ordersPerDay(hotfix, 'hotfix'))}`}
      />
      <StatTile
        label={`Payment failure rate · ${windows.incident.label}`}
        state={tile(failureShare(incident), failureShare(before))}
        format={(value) => percentFormat.format(value)}
        unit="%"
        goodDirection="decrease"
        formatDelta={pointsDelta}
        trend={trend('Daily payment failure rate', failureShare, percentFormatters)}
        note="Failed ÷ submitted payment attempts"
      />
      <StatTile
        label={`3-D Secure timeouts · ${windows.incident.label}`}
        state={tile(timeoutShareOfCards(incident), timeoutShareOfCards(before))}
        format={(value) => percentFormat.format(value)}
        unit="%"
        goodDirection="decrease"
        formatDelta={pointsDelta}
        trend={trend('Daily 3-D Secure timeout share', timeoutShareOfCards, percentFormatters)}
        note="Share of card payment attempts submitted"
      />
    </section>
  )
}

function TrendWidget({ slice, before }: { readonly slice: Slice; readonly before: Totals }) {
  const [range, setRange] = useState<TrendRange>('all')
  const filtered = isFiltered(slice)
  const start = trendRangeStart[range]
  const sliceName = filtered ? sliceLabel(slice) : 'All checkouts'
  const rows = useMemo(() => {
    const series = (target: Slice, name: string, prefix: string) => dailyTotals(target)
      .filter((day) => day.date >= start)
      .map((day): TimeSeriesDatum => ({ id: `${prefix}-${day.date}`, date: utcDate(day.date), value: point(conversion(day.totals)), series: name }))
    return [...series(slice, sliceName, 'slice'), ...(filtered ? series(allSlice, 'All checkouts', 'all') : [])]
  }, [slice, sliceName, filtered, start])
  const beforeConversion = conversion(before)
  return (
    <Widget
      title="Daily checkout conversion"
      note="Confirmed orders as a share of checkouts started, per UTC day. The dashed line is the average for 17 Aug – 7 Sep."
      controls={<TimeRangeControl value={range} options={trendRangeOptions} onChange={setRange} />}
    >
      <LineChart
        state={chartData(rows)}
        ariaLabel={`Daily checkout conversion for ${sliceName}`}
        ariaDescription={`Daily checkout conversion from ${start} to 2026-09-27.${filtered ? ' All checkouts are shown as a context series.' : ''}`}
        xLabel="Day"
        yLabel="Checkout conversion (%)"
        reference={beforeConversion === null ? undefined : { value: beforeConversion, label: `Average ${windows.before.label}` }}
        highlights={[incidentHighlight, ...eventHighlights]}
        appearance={{ points: false }}
        crosshair
        formatters={percentFormatters}
        style={filtered ? contextSeriesStyle : undefined}
        height={340}
      />
    </Widget>
  )
}

function dumbbellRows(slice: Slice, dimension: SliceDimension): DumbbellDatum[] {
  return sliceOptions[dimension].flatMap((value): DumbbellDatum[] => {
    const segment = withSliceValue(slice, dimension, value)
    const start = conversion(windowTotals(segment, 'before'))
    const end = conversion(windowTotals(segment, 'incident'))
    return start === null || end === null ? [] : [{ id: value, category: value, start, end }]
  })
}

function WhereWidget() {
  const filters = caseFilters.useFilters()
  const slice = sliceFromFilters(filters.values)
  // Each panel keeps its own dimension unfiltered so the reader can change the selection there.
  const panels = sliceDimensions.map((dimension) => ({
    dimension,
    rows: dumbbellRows({ ...slice, [dimension]: 'All' }, dimension),
  }))
  const values = panels.flatMap((panel) => panel.rows.flatMap((row) => [row.start, row.end]))
  const domain: readonly [number, number] = [Math.floor((Math.min(...values) - 2) / 5) * 5, Math.ceil((Math.max(...values) + 2) / 5) * 5]
  return (
    <section className="case-section" aria-labelledby="case-where-heading">
      <div className="case-section-heading">
        <h2 id="case-where-heading">Where did it drop?</h2>
        <p className="case-note">Checkout conversion before the release and during the incident window. Select a row to filter every chart.</p>
      </div>
      <div className="case-grid-3">
        {panels.map((panel) => (
          <Widget key={panel.dimension} title={`By ${sliceLabels[panel.dimension].toLowerCase()}`} note={`Within ${sliceDimensions.filter((other) => other !== panel.dimension).map((other) => slice[other] === 'All' ? sliceAllLabels[other].toLowerCase() : slice[other]).join(', ')}.`}>
            <DumbbellChart
              state={chartData(panel.rows)}
              startLabel={windows.before.label}
              endLabel={windows.incident.label}
              categoryLabel={sliceLabels[panel.dimension]}
              valueLabel="Checkout conversion (%)"
              domain={domain}
              formatChange={formatPoints}
              formatters={percentFormatters}
              selection={filters.selection(panel.dimension)}
              ariaLabel={`Checkout conversion by ${sliceLabels[panel.dimension].toLowerCase()}, before and during the incident`}
              ariaDescription={`Checkout conversion per ${sliceLabels[panel.dimension].toLowerCase()} for ${windows.before.label} and ${windows.incident.label} 2026.`}
              height={210}
            />
          </Widget>
        ))}
      </div>
    </section>
  )
}

function MatrixWidget() {
  const filters = caseFilters.useFilters()
  const slice = sliceFromFilters(filters.values)
  const cells = checkoutRegions.flatMap((region) => checkoutDevices.flatMap((device): HeatmapDatum[] => {
    const segment: Slice = { region, device, payment: slice.payment }
    const change = difference(conversion(windowTotals(segment, 'incident')), conversion(windowTotals(segment, 'before')))
    return change === null ? [] : [{ id: `${region}-${device}`, x: device, y: region, value: change }]
  }))
  const extent = Math.max(1, ...cells.map((cell) => Math.abs(cell.value)))
  const largest = cells.reduce<HeatmapDatum | undefined>((worst, cell) => worst === undefined || cell.value < worst.value ? cell : worst, undefined)
  const highlights: readonly CellHighlight[] = largest === undefined || largest.value > -2 ? [] : [{ x: largest.x, y: largest.y, label: 'Largest drop' }]
  const paymentText = slice.payment === 'All' ? 'all payment methods' : `${slice.payment} payments`
  return (
    <Widget title="Change by region and device" note={`Percentage-point change in checkout conversion, ${windows.incident.label} against ${windows.before.label}, for ${paymentText}. Select a cell to filter by region and device.`}>
      <HeatmapChart
        state={chartData(cells)}
        colorScale={{ kind: 'diverging', domain: [-extent, 0, extent] }}
        valueLabels
        highlights={highlights}
        xLabel="Device"
        yLabel="Region"
        valueLabel="Change (pp)"
        formatters={pointFormatters}
        selection={{
          value: slice.region !== 'All' && slice.device !== 'All' ? { x: slice.device, y: slice.region } : null,
          onChange: (cell) => {
            filters.update({ region: cell?.y ?? null, device: cell?.x ?? null })
          },
        }}
        ariaLabel="Change in checkout conversion by region and device"
        ariaDescription={`Percentage-point change in checkout conversion from ${windows.before.label} to ${windows.incident.label}, by region and device, for ${paymentText}.`}
        height={260}
      />
    </Widget>
  )
}

function ReasonsWidget({ slice }: { readonly slice: Slice }) {
  const rows = useMemo(() => dailyTotals(slice).flatMap((day): StackedAreaDatum[] => {
    const totals = day.totals
    if (totals.submitted === 0) return []
    const date = utcDate(day.date)
    return [
      { id: `${day.date}-3ds`, date, value: share(totals.failed3ds, totals.submitted) ?? 0, series: failureReasons[0] },
      { id: `${day.date}-declined`, date, value: share(totals.failedDeclined, totals.submitted) ?? 0, series: failureReasons[1] },
      { id: `${day.date}-gateway`, date, value: share(totals.failedGateway, totals.submitted) ?? 0, series: failureReasons[2] },
    ]
  }), [slice])
  return (
    <Widget title="Payment failures by reason" note="Failed payment attempts as a share of attempts submitted, per day, stacked by reason. The stack height is the total failure rate.">
      <StackedAreaChart
        state={chartData(rows)}
        seriesOrder={failureReasons}
        xLabel="Day"
        yLabel="Share of payment attempts (%)"
        highlights={[incidentHighlight]}
        ariaLabel="Daily payment failures by reason"
        ariaDescription={`Daily share of submitted payment attempts that failed, stacked by reason, for ${sliceLabel(slice)} from 17 Aug to 27 Sep 2026.`}
        formatters={percentFormatters}
        crosshair
        tooltip={{
          groupedTotal: (points) => {
            const total = points.reduce((sum, item) => {
              if (typeof item.yValue !== 'number') throw new TypeError('Stacked failure shares require numeric values.')
              return sum + item.yValue
            }, 0)
            return { label: 'All failures', value: `${percentFormat.format(total)}%` }
          },
        }}
        height={260}
      />
    </Widget>
  )
}

function BuildWidget({ slice }: { readonly slice: Slice }) {
  const builds = buildTotals(slice)
  const rows = builds.flatMap((build): HorizontalBarDatum[] => {
    const value = share(build.failed3ds, build.submitted)
    return value === null ? [] : [{ id: build.build, category: build.build, value }]
  })
  const highlights: readonly CategoryHighlight[] = rows
    .filter((row) => row.category !== '4.11.3')
    .map((row) => ({ category: row.category, label: 'Released on EU · Mobile web' }))
  const regionText = slice.region === 'All' ? 'all regions' : slice.region
  const deviceText = slice.device === 'All' ? 'all devices' : slice.device
  return (
    <Widget
      title="3-D Secure timeouts by checkout build"
      note={`Card payments only, for ${regionText} · ${deviceText}.`}
      footer={builds.map((build) => (
        <span key={build.build}>{build.build}: {integerFormat.format(build.failed3ds)} of {integerFormat.format(build.submitted)} card attempts timed out over {build.days} days.</span>
      ))}
    >
      <BarChart
        state={chartData(rows)}
        orientation="horizontal"
        layout="single"
        categoryLabel="Checkout build"
        valueLabel="3-D Secure timeouts (% of card attempts)"
        valueLabelPlacement="outside-end"
        highlights={highlights}
        ariaLabel="3-D Secure timeouts by checkout build"
        ariaDescription={`Share of card payment attempts that timed out in the 3-D Secure challenge, per checkout build, for ${regionText} and ${deviceText}.`}
        formatters={percentFormatters}
        height={200}
      />
    </Widget>
  )
}

function FunnelWidget({ before, incident }: { readonly before: Totals; readonly incident: Totals }) {
  const shares = (totals: Totals) => [100, shippingShare(totals), submittedShare(totals), conversion(totals)]
  const beforeShares = shares(before)
  const incidentShares = shares(incident)
  const rows = funnelSteps.flatMap((step, index): SeriesBarDatum[] => {
    const beforeValue = beforeShares[index]
    const incidentValue = incidentShares[index]
    if (beforeValue === null || incidentValue === null || beforeValue === undefined || incidentValue === undefined) return []
    return [
      { id: `${step}-before`, category: step, value: beforeValue, series: windows.before.label },
      { id: `${step}-incident`, category: step, value: incidentValue, series: windows.incident.label },
    ]
  })
  // The step whose loss grew most against the earlier window is the one that changed.
  const lossGrowth = funnelSteps.map((step, index) => {
    if (index === 0) return { step, growth: Number.NEGATIVE_INFINITY }
    const previousBefore = beforeShares[index - 1] ?? null
    const currentBefore = beforeShares[index] ?? null
    const previousIncident = incidentShares[index - 1] ?? null
    const currentIncident = incidentShares[index] ?? null
    if (previousBefore === null || currentBefore === null || previousIncident === null || currentIncident === null) return { step, growth: Number.NEGATIVE_INFINITY }
    return { step, growth: (previousIncident - currentIncident) - (previousBefore - currentBefore) }
  })
  const changed = lossGrowth.reduce((best, item) => item.growth > best.growth ? item : best)
  const highlights: readonly CategoryHighlight[] = changed.growth > 1 ? [{ category: changed.step, label: 'Loss grew most' }] : []
  return (
    <Widget title="Checkout funnel" note={`Share of checkouts started that reach each step, ${windows.before.label} against ${windows.incident.label}.`}>
      <BarChart
        state={chartData(rows)}
        orientation="horizontal"
        layout="grouped"
        seriesOrder={[windows.before.label, windows.incident.label]}
        categoryLabel="Checkout step"
        valueLabel="Share of checkouts started (%)"
        highlights={highlights}
        ariaLabel="Checkout funnel, before and during the incident"
        ariaDescription={`Share of checkouts started that reached each step for ${windows.before.label} and ${windows.incident.label} 2026.`}
        formatters={percentFormatters}
        style={windowSeriesStyle}
        height={260}
      />
    </Widget>
  )
}

function Findings() {
  const all = { before: windowTotals(allSlice, 'before'), incident: windowTotals(allSlice, 'incident'), hotfix: windowTotals(allSlice, 'hotfix') }
  const eu: Slice = { region: 'EU', device: 'All', payment: 'All' }
  const euMobileCard: Slice = { region: 'EU', device: 'Mobile web', payment: 'Card' }
  const builds = buildTotals({ region: 'EU', device: 'Mobile web', payment: 'All' })
  const timeoutFor = (build: string) => {
    const totals = builds.find((candidate) => candidate.build === build)
    return totals ? formatPercent(share(totals.failed3ds, totals.submitted)) : '—'
  }
  return (
    <section className="case-findings" aria-labelledby="case-findings-heading">
      <h2 id="case-findings-heading">What we found</h2>
      <ol>
        <li><b>Timing.</b> Overall conversion was flat at about {formatPercent(conversion(all.before))} until 8 September, then dropped to {formatPercent(conversion(all.incident))} for two weeks and recovered to {formatPercent(conversion(all.hotfix))} after the 22 September hotfix. The 1–3 September APAC promotion and the 26 August gateway blip are visible but short, and neither changed EU numbers.</li>
        <li><b>Where.</b> Only EU moved ({formatPoints(difference(conversion(windowTotals(eu, 'incident')), conversion(windowTotals(eu, 'before'))))}); NA, APAC and LATAM stayed within a point. Within EU, only Mobile web moved, and within that only Card payments: EU · Mobile web · Card went from {formatPercent(conversion(windowTotals(euMobileCard, 'before')))} to {formatPercent(conversion(windowTotals(euMobileCard, 'incident')))}.</li>
        <li><b>Mechanism.</b> The funnel loss is at the payment step. Failures by reason show one mover: 3-D Secure challenge timeouts. Issuer declines and gateway errors did not change.</li>
        <li><b>Root cause.</b> web-checkout 4.12.0 (8 Sep, EU mobile web) enforced the 3-D Secure challenge with a 10-second window. Timeouts were {timeoutFor('4.11.3')} of card payments on 4.11.3, {timeoutFor('4.12.0')} on 4.12.0 and still {timeoutFor('4.12.1')} on the 4.12.1 hotfix, so the hotfix is partial.</li>
        <li><b>Next.</b> Finish the 4.12.1 investigation (timeouts remain about five times the baseline), gate the 3-D Secure enforcement behind a staged rollout with a conversion guard, and add a per-build failure-rate alert.</li>
      </ol>
    </section>
  )
}

export interface CheckoutCasePageProps {
  readonly initialFilters?: { readonly region: string | null; readonly device: string | null; readonly payment: string | null }
}

const noFilters = { region: null, device: null, payment: null } as const

export function CheckoutCasePage({ initialFilters = noFilters }: CheckoutCasePageProps) {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <caseFilters.Provider defaultValues={initialFilters}>
        <CasePageBody />
      </caseFilters.Provider>
    </ChartProvider>
  )
}

function CasePageBody() {
  const slice = useSlice()
  const before = windowTotals(slice, 'before')
  const incident = windowTotals(slice, 'incident')
  const hotfix = windowTotals(slice, 'hotfix')
  const allBefore = windowTotals(allSlice, 'before')
  const allIncident = windowTotals(allSlice, 'incident')
  const segmentIncident = windowTotals({ region: 'EU', device: 'Mobile web', payment: 'Card' }, 'incident')
  const euBuilds = buildTotals({ region: 'EU', device: 'Mobile web', payment: 'All' })
  const timeoutShare = (build: string) => {
    const totals = euBuilds.find((candidate) => candidate.build === build)
    return totals ? formatPercent(share(totals.failed3ds, totals.submitted)) : '—'
  }

  return (
      <div className="case-surface">
        <main className="case-page">
          <header className="case-header">
            <p className="case-eyebrow">Case study · Checkout funnel</p>
            <h1>Checkout conversion drop</h1>
            <p className="case-takeaway">
              Checkout conversion fell from <b>{formatPercent(conversion(allBefore))}</b> to <b>{formatPercent(conversion(allIncident))}</b> in the two weeks from 8 September.
              The loss sits almost entirely in EU · Mobile web · Card payments, which fell to <b>{formatPercent(conversion(segmentIncident))}</b>:
              3-D Secure challenge timeouts on checkout build 4.12.0 reached <b>{timeoutShare('4.12.0')}</b> of card payments, against <b>{timeoutShare('4.11.3')}</b> on the previous build.
            </p>
            <p className="case-scope">17 Aug – 27 Sep 2026, UTC days · Northwind Outfitters (synthetic data) · Compare window: <b>{windows.incident.label}</b> against <b>{windows.before.label}</b></p>
          </header>

          <PageFilters />
          <KpiRow slice={slice} before={before} incident={incident} hotfix={hotfix} />
          <TrendWidget slice={slice} before={before} />
          <WhereWidget />

          <section className="case-grid-2" aria-label="Change by segment and failure reason">
            <MatrixWidget />
            <ReasonsWidget slice={slice} />
          </section>

          <section className="case-grid-2" aria-label="Root cause and funnel">
            <BuildWidget slice={slice} />
            <FunnelWidget before={before} incident={incident} />
          </section>

          <Findings />

          <footer className="case-definitions">
            <p><b>Checkout conversion</b> = confirmed orders ÷ checkouts started, by UTC day. <b>Payment failure rate</b> = failed payment attempts ÷ payment attempts submitted. <b>3-D Secure timeouts</b> = card attempts whose issuer challenge did not complete in time ÷ card attempts submitted. Shares are computed on summed counts, not averaged daily rates.</p>
            <p>Source: {checkoutSource.name}, grain {checkoutSource.grain}, as of {checkoutSource.asOf}. Generated for a tooling comparison; the numbers are not from a real store.</p>
          </footer>
        </main>
      </div>
  )
}
