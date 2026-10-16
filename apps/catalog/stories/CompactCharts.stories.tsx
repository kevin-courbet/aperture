import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { CompactExamples } from './components/CompactExamples'

export default {
  title: 'Charts/Compact charts',
  decorators: [withCatalogCanvas],
  meta: { description: 'A compact AreaChart or LineChart sits in a stat tile. It draws no axes, grid lines, legend, or standalone controls. The tooltip and the exact-value table stay available.' },
} satisfies StoryDefault

export const InStatTiles: Story = () => <CompactExamples />
export const HostOverridesDarkTheme: Story = () => <CompactExamples />
