import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Focus and tooltip',
  decorators: [withCatalogCanvas],
  meta: { description: 'Focus and tooltip behavior must work with keyboard and pointer input.' },
} satisfies StoryDefault

export const KeyboardAndPointer: Story = () => <InteractionExample mode="focus" />
