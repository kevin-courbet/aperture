import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Maps',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Use geography only when location is part of the question.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const ChoroplethChart: ChartStory = (args) => <ChartExample {...args} />
ChoroplethChart.args = { name: 'ChoroplethChart' }

export const RouteMapChart: ChartStory = (args) => <ChartExample {...args} />
RouteMapChart.args = { name: 'RouteMapChart' }
