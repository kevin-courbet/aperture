import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Focus and tooltip', component: InteractionExample, args: { mode: 'focus' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Focus and tooltip behavior must work with keyboard and pointer input.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const KeyboardAndPointer: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const disclosure = canvas.getByRole('button', { name: 'Show exact values' })
    await expect(disclosure).toBeVisible()
    const legend = canvas.getByRole('list', { name: 'Chart legend' })
    await expect(within(legend).getByText(/Goal/)).toHaveTextContent('Goal: 55')
    const chart = canvas.getByRole('img', { name: 'Completed work focus example' })
    await expect(chart).toHaveAttribute('tabindex', '0')
    chart.focus()
    await expect(chart).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(chart).toHaveFocus()
    const bounds = chart.getBoundingClientRect()
    const clientX = bounds.left + bounds.width * 0.05
    const clientY = bounds.top + bounds.height * 0.81
    const pointerTarget = chart.ownerDocument.elementFromPoint(clientX, clientY)
    if (!pointerTarget) throw new Error('The chart pointer target is not available.')
    await userEvent.pointer({
      target: pointerTarget,
      coords: { clientX, clientY },
    })
    await waitFor(() => expect(canvas.getByText('Selected records: 1')).toBeVisible())
    const tooltip = canvas.getByRole('status')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveTextContent('1 Jan 2025, 00:00 UTC: 42')
    await userEvent.click(disclosure)
    await expect(canvas.getByRole('table', { name: 'Exact chart values' })).toBeVisible()
    await expect(canvas.getByRole('cell', { name: '57' })).toBeVisible()
  },
}
