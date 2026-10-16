import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery } from './components/ChartExamples'

export default {
  title: 'States/Responsive',
  decorators: [withCatalogCanvas],
  meta: { description: 'The chart keeps its controls and exact values at a compact mobile width.' },
} satisfies StoryDefault

export const CompactMobile: Story = () => <StateGallery mode="responsive" />
CompactMobile.meta = { width: 390 }
