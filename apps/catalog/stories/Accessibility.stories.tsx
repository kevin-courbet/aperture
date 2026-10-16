import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { StateGallery, UnavailableExactValueExample } from './components/ChartExamples'

export default {
  title: 'States/Accessibility',
  decorators: [withCatalogCanvas],
  meta: { description: 'Accessible names, keyboard controls, visible focus, and exact values are part of the chart output.' },
} satisfies StoryDefault

export const ExactValuesAndFocus: Story = () => <StateGallery mode="accessibility" />
export const ExactValuesUnavailable: Story = () => <UnavailableExactValueExample />
