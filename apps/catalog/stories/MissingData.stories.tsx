import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery } from './components/ChartExamples'

export default {
  title: 'States/Missing data',
  decorators: [withCatalogCanvas],
  meta: { description: 'Unknown values make a visible gap. They are not zero and are not connected.' },
} satisfies StoryDefault

export const VisibleGap: Story = () => <StateGallery mode="missing" />
