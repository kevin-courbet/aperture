import type { Meta, StoryObj } from '@storybook/react-vite'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/One result', component: StateGallery, args: { mode: 'one' }, parameters: { controls: { disable: true }, docs: { description: { component: 'One observation renders as one value, not as a trend.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const ObservationNotTrend: StoryObj<typeof meta> = {}
