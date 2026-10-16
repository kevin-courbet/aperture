import type { Story, StoryDefault } from '@ladle/react'
import { type CatalogParameters, withCatalogCanvas } from '../src/story'
import { calendarContextSeries, ChartExample, type ChartExampleProps, defaultControls, LinePresentationExample, lineGoalArgType, midMonthObservationSeries, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Change over time',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Use these charts for ordered change. Do not draw a trend for one result.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const LineChart: ChartStory = (args) => <ChartExample {...args} />
LineChart.args = { name: 'LineChart', showGoal: true }
LineChart.argTypes = lineGoalArgType

export const AreaChart: ChartStory = (args) => <ChartExample {...args} />
AreaChart.args = { name: 'AreaChart' }

export const CalendarContext: ChartStory = (args) => <ChartExample {...args} />
CalendarContext.args = {
  name: 'LineChart',
  dataOverride: calendarContextSeries,
  timeAxis: { position: 'elapsed', ticks: { kind: 'automatic' } },
}
CalendarContext.meta = { description: 'Automatic calendar ticks adapt to width and show the year only when context changes.' }

export const QuarterlyTicks: ChartStory = (args) => <ChartExample {...args} />
QuarterlyTicks.args = {
  name: 'LineChart',
  dataOverride: calendarContextSeries,
  timeAxis: { position: 'elapsed', ticks: { kind: 'calendar', interval: { unit: 'quarter', step: 1 } } },
}
QuarterlyTicks.meta = { description: 'A caller can require one tick for each calendar quarter.' }

export const ObservationDates: ChartStory = (args) => <ChartExample {...args} />
ObservationDates.args = {
  name: 'LineChart',
  dataOverride: midMonthObservationSeries,
  timeAxis: { position: 'observations' },
}

export const LinePresentation: Story = () => <LinePresentationExample />
LinePresentation.meta = { description: 'Line appearance controls fill, curve, and point visibility for each series.' }
LinePresentation.parameters = { test: false } satisfies CatalogParameters
