import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Relationships',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Inspect association, clusters, and unusual observations without claiming cause.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const ScatterChart: ChartStory = (args) => <ChartExample {...args} />
ScatterChart.args = { name: 'ScatterChart' }

export const NetworkChart: ChartStory = (args) => <ChartExample {...args} />
NetworkChart.args = { name: 'NetworkChart' }
