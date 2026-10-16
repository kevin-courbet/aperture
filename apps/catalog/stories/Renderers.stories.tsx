import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery } from './components/ChartExamples'

export default {
  title: 'States/Renderers',
  decorators: [withCatalogCanvas],
  meta: { description: 'SVG, Canvas, and motion hosts provide the same accessible chart and exact-value output. Inspect motion transitions visually.' },
} satisfies StoryDefault

export const SvgAndCanvas: Story = () => <StateGallery mode="renderers" />
