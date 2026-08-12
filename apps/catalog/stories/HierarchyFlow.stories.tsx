import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Hierarchy and flow', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Inspect nested quantities and movement between stages.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const TreemapChart: ChartStory = { args: { name: 'TreemapChart' } }
export const SunburstChart: ChartStory = { args: { name: 'SunburstChart' } }
export const SankeyChart: ChartStory = { args: { name: 'SankeyChart' } }
