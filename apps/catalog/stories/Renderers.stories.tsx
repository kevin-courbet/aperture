import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/Renderers', component: StateGallery, args: { mode: 'renderers' }, parameters: { controls: { disable: true }, docs: { description: { component: 'The same ScatterChart data uses the selected package SVG or Canvas host. Both outputs include exact-value disclosure.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const SvgAndCanvas: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const svgExample = within(canvas.getByRole('region', { name: 'SVG renderer example' }))
    const canvasExample = within(canvas.getByRole('region', { name: 'Canvas renderer example' }))
    await expect(svgExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
    await expect(canvasExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
    await userEvent.click(svgExample.getByRole('button', { name: 'Show exact values' }))
    await userEvent.click(canvasExample.getByRole('button', { name: 'Show exact values' }))
    await expect(svgExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
    await expect(canvasExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
  },
}
