import type { Story, StoryDefault } from '@ladle/react'
import { type CatalogParameters, withCatalogCanvas } from '../src/story'
import { DemoPage } from './components/DemoPage'
import '../src/demo.css'

export default {
  title: 'Demo/Overview',
  decorators: [withCatalogCanvas],
  parameters: { pageStyle: 'demo' } satisfies CatalogParameters,
  meta: { description: 'An adopter overview of the Aperture React chart experience.' },
} satisfies StoryDefault

export const AdopterOverview: Story = () => <DemoPage />
