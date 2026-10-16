import { AreaChart, ChartProvider, LineChart, StatTile, chartData, type AreaDatum, type TimeSeriesDatum } from '@kevin-courbet/aperture'
import { throughputByMonth } from '../../src/fixtures/operations'

const completed = throughputByMonth.map((row): AreaDatum => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.completed },
}))
const queued = throughputByMonth.map((row): TimeSeriesDatum => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.queued },
}))
const latest = throughputByMonth[throughputByMonth.length - 1]!
const previous = throughputByMonth[throughputByMonth.length - 2]!
const integer = new Intl.NumberFormat('en-GB')

export function CompactExamples() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <div className="catalog-stat-grid">
        <StatTile
          label="Completed items · June 2025"
          state={{ status: 'ready', datum: { value: latest.completed, comparison: { value: previous.completed, label: 'vs May 2025' } } }}
          format={(value) => integer.format(value)}
          goodDirection="increase"
          formatDelta={(delta) => integer.format(delta)}
          trend={(
            <AreaChart
              compact
              ariaLabel="Completed items by month"
              ariaDescription="Monthly completed items from January to June 2025."
              state={chartData(completed)}
              appearance={{ fill: { kind: 'vertical-gradient' }, outline: { width: 1.5 } }}
              crosshair
              height={56}
              initialWidth={220}
            />
          )}
        />
        <StatTile
          label="Queued items · June 2025"
          state={{ status: 'ready', datum: { value: latest.queued, comparison: { value: previous.queued, label: 'vs May 2025' } } }}
          format={(value) => integer.format(value)}
          goodDirection="decrease"
          formatDelta={(delta) => integer.format(delta)}
          trend={(
            <LineChart
              compact
              ariaLabel="Queued items by month"
              ariaDescription="Monthly queued items from January to June 2025."
              state={chartData(queued)}
              height={56}
              initialWidth={220}
            />
          )}
        />
      </div>
    </ChartProvider>
  )
}
