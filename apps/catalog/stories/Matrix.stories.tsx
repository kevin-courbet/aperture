import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Matrix', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Compare values across two categorical dimensions.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const HeatmapChart: ChartStory = { args: { name: 'HeatmapChart' } }
