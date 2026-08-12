import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Brush', component: InteractionExample, args: { mode: 'brush' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Brush interaction selects a bounded interval.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const IntervalSelection: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = canvas.getByRole('slider', { name: 'Range start' })
    start.focus()
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Selected months: 4 to 6')
    const reset = canvas.getByRole('button', { name: 'Reset range' })
    await expect(reset).toBeEnabled()
    await userEvent.click(reset)
    await expect(canvas.getByRole('status')).toHaveTextContent('Selected months: 1 to 6')
    await expect(reset).toBeDisabled()
  },
}
