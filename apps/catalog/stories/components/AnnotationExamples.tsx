import { useMemo, useState } from 'react'
import {
  ActiveFilters,
  BarChart,
  ChartProvider,
  ChartToolbar,
  ChartWidget,
  FilterBar,
  HeatmapChart,
  LineChart,
  SelectControl,
  chartData,
  createCrossFilter,
  useCrossFilter,
  type CrossFilter,
  type CrossFilterValues,
  type TimeSeriesDatum,
} from '@kevin-courbet/aperture'
import { channelVolume, serviceMatrix, throughputByMonth } from '../../src/fixtures/operations'

const completed = throughputByMonth.map((row): TimeSeriesDatum => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.completed },
}))

const channelBars = channelVolume.map((row) => ({ id: row.category.toLowerCase(), category: row.category, value: row.value }))
const serviceCells = serviceMatrix.map((row, index) => ({ id: `cell-${index}`, x: row.column, y: row.row, value: row.value }))

export function HighlightExamples() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <div className="catalog-annotation-grid">
        <section className="catalog-annotation" aria-labelledby="highlight-time-heading">
          <h2 id="highlight-time-heading">Time ranges and events</h2>
          <LineChart
            ariaLabel="Completed work with highlights"
            ariaDescription="Monthly completed items from January to June 2025."
            state={chartData(completed)}
            xLabel="Month"
            yLabel="Completed items"
            highlights={[
              { kind: 'range', start: new Date('2025-02-01T00:00:00Z'), end: new Date('2025-03-01T00:00:00Z'), label: 'Hiring freeze' },
              { kind: 'event', date: new Date('2025-04-01T00:00:00Z'), label: 'New intake process' },
            ]}
          />
        </section>
        <section className="catalog-annotation" aria-labelledby="highlight-bar-heading">
          <h2 id="highlight-bar-heading">Categories</h2>
          <BarChart
            ariaLabel="Volume by channel with a highlighted channel"
            ariaDescription="Completed items by channel."
            state={chartData(channelBars)}
            orientation="horizontal"
            layout="single"
            categoryLabel="Channel"
            valueLabel="Completed items"
            valueLabelPlacement="outside-end"
            highlights={[{ category: 'Partner', label: 'Contract renewal' }]}
          />
        </section>
        <section className="catalog-annotation" aria-labelledby="highlight-cell-heading">
          <h2 id="highlight-cell-heading">Matrix cells</h2>
          <HeatmapChart
            ariaLabel="Service scores with a highlighted cell"
            ariaDescription="Service scores out of 100 by weekday."
            state={chartData(serviceCells)}
            colorScale={{ kind: 'sequential', domain: [0, 100] }}
            valueLabels
            xLabel="Weekday"
            yLabel="Service"
            valueLabel="Score"
            highlights={[{ x: 'Mon', y: 'Export', label: 'Release day' }]}
          />
        </section>
      </div>
    </ChartProvider>
  )
}

const regions = ['North', 'Central', 'South'] as const
const channels = ['Direct', 'Partner', 'Referral'] as const
type Region = (typeof regions)[number]
type Channel = (typeof channels)[number]

const orders: readonly { readonly region: Region; readonly channel: Channel; readonly orders: number }[] = [
  { region: 'North', channel: 'Direct', orders: 120 },
  { region: 'North', channel: 'Partner', orders: 64 },
  { region: 'North', channel: 'Referral', orders: 31 },
  { region: 'Central', channel: 'Direct', orders: 88 },
  { region: 'Central', channel: 'Partner', orders: 97 },
  { region: 'Central', channel: 'Referral', orders: 22 },
  { region: 'South', channel: 'Direct', orders: 54 },
  { region: 'South', channel: 'Partner', orders: 41 },
  { region: 'South', channel: 'Referral', orders: 58 },
]

function totalsBy<TKey extends string>(keys: readonly TKey[], rows: typeof orders, key: (row: (typeof orders)[number]) => TKey) {
  return keys.map((category) => ({
    id: category.toLowerCase(),
    category,
    value: rows.filter((row) => key(row) === category).reduce((sum, row) => sum + row.orders, 0),
  }))
}

function OrdersWidget({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <ChartWidget.Root exactValues="available" className="catalog-cross-widget">
      <ChartWidget.Header><h2>{title}</h2></ChartWidget.Header>
      <ChartToolbar />
      <ChartWidget.Plot>{children}</ChartWidget.Plot>
    </ChartWidget.Root>
  )
}

type OrderDimension = 'region' | 'channel'

// One typed filter group for the page. Components below its Provider read it without props.
const orderFilters = createCrossFilter<OrderDimension>('OrderFilters')

const regionOptions = [{ value: 'North', label: 'North' }, { value: 'Central', label: 'Central' }, { value: 'South', label: 'South' }] as const
const channelOptions = [{ value: 'Direct', label: 'Direct' }, { value: 'Partner', label: 'Partner' }, { value: 'Referral', label: 'Referral' }] as const

function OrderFilterBar({ filters }: { readonly filters: CrossFilter<OrderDimension> }) {
  return (
    <FilterBar>
      <SelectControl label="Region" value={filters.values.region} allLabel="All regions" options={regionOptions} onChange={(value) => filters.set('region', value)} />
      <SelectControl label="Channel" value={filters.values.channel} allLabel="All channels" options={channelOptions} onChange={(value) => filters.set('channel', value)} />
      <ActiveFilters filters={filters} labels={{ region: 'Region', channel: 'Channel' }} />
    </FilterBar>
  )
}

// Each chart ignores its own dimension so the reader can change the selection there.
function OrdersByRegion({ filters }: { readonly filters: CrossFilter<OrderDimension> }) {
  const rows = useMemo(() => totalsBy(regions, orders.filter((row) => filters.values.channel === null || row.channel === filters.values.channel), (row) => row.region), [filters.values.channel])
  return (
    <OrdersWidget title="Orders by region">
      <BarChart
        ariaLabel="Orders by region"
        ariaDescription="Orders per region for the selected channel."
        state={chartData(rows)}
        orientation="horizontal"
        layout="single"
        categoryLabel="Region"
        valueLabel="Orders"
        valueLabelPlacement="outside-end"
        selection={filters.selection('region')}
      />
    </OrdersWidget>
  )
}

function OrdersByChannel({ filters }: { readonly filters: CrossFilter<OrderDimension> }) {
  const rows = useMemo(() => totalsBy(channels, orders.filter((row) => filters.values.region === null || row.region === filters.values.region), (row) => row.channel), [filters.values.region])
  return (
    <OrdersWidget title="Orders by channel">
      <BarChart
        ariaLabel="Orders by channel"
        ariaDescription="Orders per channel for the selected region."
        state={chartData(rows)}
        orientation="horizontal"
        layout="single"
        categoryLabel="Channel"
        valueLabel="Orders"
        valueLabelPlacement="outside-end"
        selection={filters.selection('channel')}
      />
    </OrdersWidget>
  )
}

function ConnectedFilterBar() {
  return <OrderFilterBar filters={orderFilters.useFilters()} />
}

function ConnectedOrdersByRegion() {
  return <OrdersByRegion filters={orderFilters.useFilters()} />
}

function ConnectedOrdersByChannel() {
  return <OrdersByChannel filters={orderFilters.useFilters()} />
}

/** Charts in separate components share one filter group through its Provider. */
export function CrossFilterExample() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <orderFilters.Provider defaultValues={{ region: null, channel: null }}>
        <div className="catalog-cross-filter">
          <ConnectedFilterBar />
          <div className="catalog-cross-grid">
            <ConnectedOrdersByRegion />
            <ConnectedOrdersByChannel />
          </div>
        </div>
      </orderFilters.Provider>
    </ChartProvider>
  )
}

function parseQuery(query: string): CrossFilterValues<OrderDimension> {
  const params = new URLSearchParams(query)
  return { region: params.get('region'), channel: params.get('channel') }
}

function toQuery(values: CrossFilterValues<OrderDimension>): string {
  const params = new URLSearchParams()
  if (values.region !== null) params.set('region', values.region)
  if (values.channel !== null) params.set('channel', values.channel)
  const text = params.toString()
  return text === '' ? '' : `?${text}`
}

/** The application owns the filter values, here as a URL query string, and Aperture reports each change. */
export function ControlledCrossFilterExample() {
  const [query, setQuery] = useState('?channel=Partner')
  const filters = useCrossFilter<OrderDimension>({ values: parseQuery(query), onChange: (next) => setQuery(toQuery(next)) })
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <div className="catalog-cross-filter">
        <div className="catalog-toolbar">
          <p>Application URL: <output aria-label="Application URL query">{query === '' ? '(no query)' : query}</output></p>
          <button type="button" onClick={() => setQuery('?region=South')}>Open link with region South</button>
        </div>
        <OrderFilterBar filters={filters} />
        <div className="catalog-cross-grid">
          <OrdersByRegion filters={filters} />
          <OrdersByChannel filters={filters} />
        </div>
      </div>
    </ChartProvider>
  )
}
