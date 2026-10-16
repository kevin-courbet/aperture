import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Facets',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Repeat the same scales and encodings across panels.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const FacetChart: ChartStory = (args) => <ChartExample {...args} />
FacetChart.args = { name: 'FacetChart' }
