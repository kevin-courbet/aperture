import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Distributions',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Inspect centre, spread, shape, and individual observations.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const HistogramChart: ChartStory = (args) => <ChartExample {...args} />
HistogramChart.args = { name: 'HistogramChart' }

export const BoxPlotChart: ChartStory = (args) => <ChartExample {...args} />
BoxPlotChart.args = { name: 'BoxPlotChart' }

export const ViolinChart: ChartStory = (args) => <ChartExample {...args} />
ViolinChart.args = { name: 'ViolinChart' }

export const RidgelineChart: ChartStory = (args) => <ChartExample {...args} />
RidgelineChart.args = { name: 'RidgelineChart' }

export const BeeswarmChart: ChartStory = (args) => <ChartExample {...args} />
BeeswarmChart.args = { name: 'BeeswarmChart' }

export const DensityChart: ChartStory = (args) => <ChartExample {...args} />
DensityChart.args = { name: 'DensityChart' }

export const EcdfChart: ChartStory = (args) => <ChartExample {...args} />
EcdfChart.args = { name: 'EcdfChart' }
