import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
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
    await userEvent.click(disclosure)
    await expect(canvas.getByRole('table', { name: 'Exact chart values' })).toBeVisible()
    await expect(canvas.getByRole('cell', { name: '57' })).toBeVisible()
  },
}
