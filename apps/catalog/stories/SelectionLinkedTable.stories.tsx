import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { InteractionExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Exact-value toolbar',
  decorators: [withCatalogCanvas],
  meta: { description: 'The widget toolbar controls the chart-owned semantic exact-value table.' },
} satisfies StoryDefault

export const ExactValueDisclosure: Story = () => <InteractionExample mode="selection" />
