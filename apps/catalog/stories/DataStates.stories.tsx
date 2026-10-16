import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery } from './components/ChartExamples'

export default {
  title: 'States/Data states',
  decorators: [withCatalogCanvas],
  meta: { description: 'Loading, empty, error, and ready are distinct chart states.' },
} satisfies StoryDefault

export const CompleteStateSet: Story = () => <StateGallery mode="data" />
