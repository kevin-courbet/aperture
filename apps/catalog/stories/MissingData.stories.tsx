import type { Meta, StoryObj } from '@storybook/react-vite'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/Missing data', component: StateGallery, args: { mode: 'missing' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Unknown values make a visible gap. They are not zero and are not connected.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const VisibleGap: StoryObj<typeof meta> = {}
