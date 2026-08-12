import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Fullscreen and time range', component: InteractionExample, args: { mode: 'fullscreen' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Fullscreen and time-range controls are explicit widget parts.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const PresentationControls: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 6 monthly values')
    await userEvent.click(canvas.getByRole('radio', { name: '3 months' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Showing 3 monthly values')
    await userEvent.click(canvas.getByRole('button', { name: 'Show exact values' }))
    const table = canvas.getByRole('table', { name: 'Exact chart values' })
    await expect(within(table).getAllByRole('row')).toHaveLength(4)
    await expect(canvas.getByRole('button', { name: 'Enter full screen' })).toBeEnabled()
  },
}
