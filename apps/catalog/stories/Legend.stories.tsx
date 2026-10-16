import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Legend',
  decorators: [withCatalogCanvas],
  meta: { description: 'Legend interaction uses labels and patterns in addition to color.' },
} satisfies StoryDefault

export const SeriesIsolation: Story = () => <InteractionExample mode="legend" />
