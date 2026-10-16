import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StatExamples } from './components/StatExamples'

export default {
  title: 'Charts/Headline figures',
  decorators: [withCatalogCanvas],
  meta: { description: 'StatTile shows one number with its change from an earlier period. Sparkline shows the recent trend without axes. The arrow, sign, and screen-reader text carry direction; color shows whether the change is good.' },
} satisfies StoryDefault

export const TilesAndSparklines: Story = () => <StatExamples />
