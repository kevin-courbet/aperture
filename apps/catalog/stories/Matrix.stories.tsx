import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Matrix',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Compare values across two categorical dimensions.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const HeatmapChart: ChartStory = (args) => <ChartExample {...args} />
HeatmapChart.args = { name: 'HeatmapChart' }
