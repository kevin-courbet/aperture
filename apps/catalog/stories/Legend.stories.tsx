import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Legend', component: InteractionExample, args: { mode: 'legend' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Legend interaction uses labels and patterns in addition to color.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const SeriesIsolation: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const reactive = canvas.getByRole('button', { name: 'reactive' })
    await expect(reactive).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(reactive)
    await expect(reactive).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('status')).toHaveTextContent('Visible series: planned, research')
    await userEvent.click(canvas.getByRole('button', { name: 'Show exact values' }))
    const table = canvas.getByRole('table', { name: 'Exact chart values' })
    await expect(within(table).queryByText('reactive')).toBeNull()
    await expect(within(table).getByRole('row', { name: /planned 31/ })).toBeVisible()
    const chart = canvas.getByRole('img', { name: 'Filtered work composition' })
    const bounds = chart.getBoundingClientRect()
    const clientX = bounds.left + bounds.width / 3
    const clientY = bounds.top + bounds.height / 2
    const pointerTarget = chart.ownerDocument.elementFromPoint(clientX, clientY)
    if (!pointerTarget) throw new Error('The chart pointer target is not available.')
    await userEvent.pointer({
      target: pointerTarget,
      coords: { clientX, clientY },
    })
    await waitFor(() => expect(canvas.getByText(/Total:/)).toBeVisible())
    const total = canvas.getByText(/Total:/)
    await expect(total).toHaveTextContent('Total: 45 items')
  },
}
