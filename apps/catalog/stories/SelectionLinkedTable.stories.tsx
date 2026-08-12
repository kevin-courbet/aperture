import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Selection and linked table', component: InteractionExample, args: { mode: 'selection' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Selection links the visual readout to a semantic exact-value table.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const ExactValueDisclosure: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const widgetHeader = canvas.getByRole('heading', { name: 'Completed work and exact values' }).closest('header')
    if (!widgetHeader) throw new Error('The linked-table widget header is missing.')
    const widgetControls = within(widgetHeader)
    await userEvent.click(widgetControls.getByRole('button', { name: 'Show exact values' }))
    await expect(canvas.getByRole('table', { name: 'Exact monthly completed work' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '2025-05-01' }))
    await expect(canvas.getByText('61 completed items')).toBeVisible()
    await expect(widgetControls.getByRole('button', { name: 'Hide exact values' })).toHaveAttribute('aria-pressed', 'true')
  },
}
