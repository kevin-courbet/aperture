import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Polar',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Use polar charts only when the circular structure supports the task.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const GaugeChart: ChartStory = (args) => <ChartExample {...args} />
GaugeChart.args = { name: 'GaugeChart' }

export const RadarChart: ChartStory = (args) => <ChartExample {...args} />
RadarChart.args = { name: 'RadarChart' }
