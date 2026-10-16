import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Fullscreen and time range',
  decorators: [withCatalogCanvas],
  meta: { description: 'Fullscreen and time-range controls are explicit widget parts.' },
} satisfies StoryDefault

export const PresentationControls: Story = () => <InteractionExample mode="fullscreen" />
