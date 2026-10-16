import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { AdvancedTooltipExample } from './components/InteractionExamples'

export default {
  title: 'Interactions/Advanced tooltip',
  decorators: [withCatalogCanvas],
  meta: { description: 'AdvancedChart composes custom React content into the TanStack tooltip.' },
} satisfies StoryDefault

export const CustomReactBody: Story = () => <AdvancedTooltipExample />
