import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { InteractionExample } from './components/InteractionExamples'
const meta = { title: 'Interactions/Zoom and pan', component: InteractionExample, args: { mode: 'zoom' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Zoom and pan preserve an explicit path back to the complete domain.' } } } } satisfies Meta<typeof InteractionExample>
export default meta
export const DomainNavigation: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const zoomSurface = canvas.getByRole('application', { name: 'Completed work zoom surface' })
    zoomSurface.focus()
    await userEvent.keyboard('+')
    await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 2.3 to 4.8; 2 values')
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 2.6 to 5.1; 3 values')
    const reset = canvas.getByRole('button', { name: 'Reset zoom' })
    await expect(reset).toBeEnabled()
    await userEvent.click(reset)
    await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 1.0 to 6.0; 6 values')
    await expect(reset).toBeDisabled()
  },
}
