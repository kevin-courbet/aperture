import type { Meta, StoryObj } from '@storybook/react-vite'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/Responsive', component: StateGallery, args: { mode: 'responsive' }, parameters: { controls: { disable: true }, docs: { description: { component: 'The chart keeps its controls and exact values at a compact mobile width.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const CompactMobile: StoryObj<typeof meta> = { globals: { viewport: { value: 'compactMobile', isRotated: false } } }
