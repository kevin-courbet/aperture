import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Zoom and pan',
  decorators: [withCatalogCanvas],
  meta: { description: 'Zoom and pan preserve an explicit path back to the complete domain.' },
} satisfies StoryDefault

export const DomainNavigation: Story = () => <InteractionExample mode="zoom" />
