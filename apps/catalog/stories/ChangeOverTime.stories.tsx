import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { calendarContextSeries, ChartExample, defaultControls, lineGoalArgType, midMonthObservationSeries, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Change over time', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Use these charts for ordered change. Do not draw a trend for one result.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const LineChart: ChartStory = { args: { name: 'LineChart', showGoal: true }, argTypes: lineGoalArgType }
export const AreaChart: ChartStory = {
  args: { name: 'AreaChart', showGoal: undefined },
  argTypes: { showGoal: { control: false, table: { disable: true } } },
}
export const CalendarContext: ChartStory = {
  args: {
    name: 'LineChart',
    dataOverride: calendarContextSeries,
    timeAxis: { kind: 'automatic' },
  },
  parameters: { docs: { description: { story: 'Automatic calendar ticks adapt to width and show the year only when context changes.' } } },
}
export const QuarterlyTicks: ChartStory = {
  args: {
    name: 'LineChart',
    dataOverride: calendarContextSeries,
    timeAxis: { kind: 'calendar', interval: { unit: 'quarter', step: 1 } },
  },
  parameters: { docs: { description: { story: 'A caller can require one tick for each calendar quarter.' } } },
}
export const ObservationDates: ChartStory = {
  args: {
    name: 'LineChart',
    dataOverride: midMonthObservationSeries,
    timeAxis: { kind: 'observations' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('15 Jan 2025')).toBeVisible()
    await expect(canvas.getByText('15 Feb')).toBeVisible()
    await expect(canvas.getByText('15 Mar')).toBeVisible()
  },
}
