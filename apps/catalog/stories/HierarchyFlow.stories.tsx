import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Hierarchy and flow',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Inspect nested quantities and movement between stages.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const TreemapChart: ChartStory = (args) => <ChartExample {...args} />
TreemapChart.args = { name: 'TreemapChart' }

export const SunburstChart: ChartStory = (args) => <ChartExample {...args} />
SunburstChart.args = { name: 'SunburstChart' }

export const SankeyChart: ChartStory = (args) => <ChartExample {...args} />
SankeyChart.args = { name: 'SankeyChart' }
