import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Intervals',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Show estimates with explicit low and high bounds.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const RangeChart: ChartStory = (args) => <ChartExample {...args} />
RangeChart.args = { name: 'RangeChart' }

export const ErrorBarChart: ChartStory = (args) => <ChartExample {...args} />
ErrorBarChart.args = { name: 'ErrorBarChart' }
