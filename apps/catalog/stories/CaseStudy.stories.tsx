import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckoutCasePage } from './components/CheckoutCasePage'
import '../src/case-study.css'

const meta = {
  title: 'Demo/Checkout case study',
  component: CheckoutCasePage,
  parameters: {
    controls: { disable: true },
    layout: 'fullscreen',
    pageStyle: 'demo',
    docs: { description: { component: 'A root-cause analysis page composed from Aperture widgets. The host owns the slice filters, aggregation, and headline figures.' } },
  },
} satisfies Meta<typeof CheckoutCasePage>

export default meta
type Story = StoryObj<typeof meta>

export const RootCause: Story = {}

export const EuMobileWebCard: Story = {
  args: { initialFilters: { region: 'EU', device: 'Mobile web', payment: 'Card' } },
}
