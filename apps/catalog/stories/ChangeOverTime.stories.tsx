import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, lineGoalArgType, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Change over time', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Use these charts for ordered change. Do not draw a trend for one result.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const LineChart: ChartStory = { args: { name: 'LineChart', showGoal: true }, argTypes: lineGoalArgType }
export const AreaChart: ChartStory = {
  args: { name: 'AreaChart', showGoal: undefined },
  argTypes: { showGoal: { control: false, table: { disable: true } } },
}
