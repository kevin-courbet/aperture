import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Composition', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Show stable parts of a meaningful whole.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const StackedAreaChart: ChartStory = { args: { name: 'StackedAreaChart' } }
export const DonutChart: ChartStory = { args: { name: 'DonutChart' } }
