import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ControlledCrossFilterExample, CrossFilterExample } from './components/AnnotationExamples'

export default {
  title: 'Interactions/Cross filter',
  decorators: [withCatalogCanvas],
  meta: { description: 'A selection in one chart filters the other charts. Dropdowns and chart activation set the same host state. Each chart keeps its own dimension unfiltered and dims the categories that are not selected.' },
} satisfies StoryDefault

export const SelectAndClear: Story = () => <CrossFilterExample />
export const ControlledByUrl: Story = () => <ControlledCrossFilterExample />
