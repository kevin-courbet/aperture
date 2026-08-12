import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Polar', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Use polar charts only when the circular structure supports the task.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const GaugeChart: ChartStory = { args: { name: 'GaugeChart' } }
export const RadarChart: ChartStory = { args: { name: 'RadarChart' } }
