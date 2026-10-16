import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Brush',
  decorators: [withCatalogCanvas],
  meta: { description: 'Brush interaction selects a bounded interval.' },
} satisfies StoryDefault

export const IntervalSelection: Story = () => <InteractionExample mode="brush" />
