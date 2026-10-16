import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { HighlightExamples } from './components/AnnotationExamples'

export default {
  title: 'Interactions/Highlights',
  decorators: [withCatalogCanvas],
  meta: { description: 'Highlights draw labeled time ranges, events, category bands, and cell outlines behind the data. The legend and the accessible description name each highlight.' },
} satisfies StoryDefault

export const RangesEventsBandsAndCells: Story = () => <HighlightExamples />
