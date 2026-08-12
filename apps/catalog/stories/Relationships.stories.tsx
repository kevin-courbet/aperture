import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Relationships', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Inspect association, clusters, and unusual observations without claiming cause.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const ScatterChart: ChartStory = { args: { name: 'ScatterChart' } }
export const NetworkChart: ChartStory = { args: { name: 'NetworkChart' } }
