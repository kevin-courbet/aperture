import { ChartProvider, Sparkline, StatTile, chartData, type SparklineDatum } from '@kevin-courbet/aperture'
import { throughputByMonth } from '../../src/fixtures/operations'

const completed = throughputByMonth.map((row): SparklineDatum => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.completed },
}))
const queued = throughputByMonth.map((row): SparklineDatum => ({
  id: row.period,
  date: new Date(`${row.period}T00:00:00Z`),
  value: { kind: 'value', value: row.queued },
}))
const latest = throughputByMonth[throughputByMonth.length - 1]!
const previous = throughputByMonth[throughputByMonth.length - 2]!
const integer = new Intl.NumberFormat('en-GB')

export function StatExamples() {
  return (
    <ChartProvider locale="en-GB" timeZone="UTC">
      <div className="catalog-stat-grid">
        <StatTile
          label="Completed items · June 2025"
          state={{ status: 'ready', datum: { value: latest.completed, comparison: { value: previous.completed, label: 'vs May 2025' } } }}
          format={(value) => integer.format(value)}
          goodDirection="increase"
          formatDelta={(delta) => integer.format(delta)}
          trend={<Sparkline state={chartData(completed)} ariaLabel="Completed items by month" accentFrom={new Date('2025-05-01T00:00:00Z')} />}
          note={`Goal: ${latest.goal} items`}
        />
        <StatTile
          label="Queued items · June 2025"
          state={{ status: 'ready', datum: { value: latest.queued, comparison: { value: previous.queued, label: 'vs May 2025' } } }}
          format={(value) => integer.format(value)}
          goodDirection="decrease"
          formatDelta={(delta) => integer.format(delta)}
          trend={<Sparkline state={chartData(queued)} ariaLabel="Queued items by month" />}
          note="Open at the end of the month"
        />
        <StatTile
          label="On-time delivery · June 2025"
          state={{ status: 'ready', datum: { value: 94.2 } }}
          format={(value) => value.toFixed(1)}
          unit="%"
          note="No earlier period is available."
        />
        <StatTile label="Refund rate · June 2025" state={{ status: 'loading' }} format={(value) => value.toFixed(1)} unit="%" />
      </div>
    </ChartProvider>
  )
}
