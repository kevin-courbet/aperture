import type { Meta, StoryObj } from '@storybook/react-vite'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/Data states', component: StateGallery, args: { mode: 'data' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Loading, empty, error, and ready are distinct chart states.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const CompleteStateSet: StoryObj<typeof meta> = {}
