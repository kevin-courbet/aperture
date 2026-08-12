import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Intervals', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Show estimates with explicit low and high bounds.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const RangeChart: ChartStory = { args: { name: 'RangeChart' } }
export const ErrorBarChart: ChartStory = { args: { name: 'ErrorBarChart' } }
