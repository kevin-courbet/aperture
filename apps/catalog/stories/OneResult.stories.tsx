import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery } from './components/ChartExamples'

export default {
  title: 'States/One result',
  decorators: [withCatalogCanvas],
  meta: { description: 'One observation renders as one value, not as a trend.' },
} satisfies StoryDefault

export const ObservationNotTrend: Story = () => <StateGallery mode="one" />
