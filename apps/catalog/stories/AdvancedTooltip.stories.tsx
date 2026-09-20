import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AdvancedTooltipExample } from './components/InteractionExamples'

const meta = {
  title: 'Interactions/Advanced tooltip',
  component: AdvancedTooltipExample,
  parameters: {
    controls: { disable: true },
    docs: { description: { component: 'AdvancedChart composes custom React content into the TanStack tooltip.' } },
  },
} satisfies Meta<typeof AdvancedTooltipExample>

export default meta

export const CustomReactBody: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chart = canvas.getByRole('img', { name: 'Advanced completed work' })
    chart.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByText('Advanced selected records: 1')).toBeVisible())
    const tooltip = canvas.getByRole('status')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveTextContent('Month 2: 48 items')
  },
}
