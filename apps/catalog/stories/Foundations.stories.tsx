import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { Guidance, RendererComparison } from './components/ChartExamples'

export default {
  title: 'Foundations/Defaults',
  decorators: [withCatalogCanvas],
  meta: { description: 'Default chart-selection and renderer guidance for developers and coding agents.' },
} satisfies StoryDefault

export const ReaderTaskFirst: Story = () => <Guidance />
export const RendererChoice: Story = () => <RendererComparison />
