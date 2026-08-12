import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Maps', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Use geography only when location is part of the question.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const ChoroplethChart: ChartStory = { args: { name: 'ChoroplethChart' } }
export const RouteMapChart: ChartStory = { args: { name: 'RouteMapChart' } }
