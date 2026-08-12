import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Distributions', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Inspect centre, spread, shape, and individual observations.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const HistogramChart: ChartStory = { args: { name: 'HistogramChart' } }
export const BoxPlotChart: ChartStory = { args: { name: 'BoxPlotChart' } }
export const ViolinChart: ChartStory = { args: { name: 'ViolinChart' } }
export const RidgelineChart: ChartStory = { args: { name: 'RidgelineChart' } }
export const BeeswarmChart: ChartStory = { args: { name: 'BeeswarmChart' } }
export const DensityChart: ChartStory = { args: { name: 'DensityChart' } }
export const EcdfChart: ChartStory = { args: { name: 'EcdfChart' } }
