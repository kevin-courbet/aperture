import type { Meta, StoryObj } from '@storybook/react-vite'
import { Guidance, RendererComparison } from './components/ChartExamples'

const meta = {
  title: 'Foundations/Defaults',
  component: Guidance,
  parameters: {
    docs: { description: { component: 'Default chart-selection and renderer guidance for developers and coding agents.' } },
    controls: { disable: true },
  },
} satisfies Meta<typeof Guidance>

export default meta
type Story = StoryObj<typeof meta>

export const ReaderTaskFirst: Story = {}
export const RendererChoice: Story = { render: () => <RendererComparison /> }
