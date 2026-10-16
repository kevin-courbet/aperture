import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Composition',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Show stable parts of a meaningful whole.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const StackedAreaChart: ChartStory = (args) => <ChartExample {...args} />
StackedAreaChart.args = { name: 'StackedAreaChart' }

export const DonutChart: ChartStory = (args) => <ChartExample {...args} />
DonutChart.args = { name: 'DonutChart' }
