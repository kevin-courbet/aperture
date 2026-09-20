import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { StateGallery } from './components/ChartExamples'
const meta = { title: 'States/Renderers', component: StateGallery, args: { mode: 'renderers' }, parameters: { controls: { disable: true }, docs: { description: { component: 'SVG, Canvas, and motion hosts provide the same accessible chart and exact-value output. Inspect motion transitions visually.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const SvgAndCanvas: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const svgExample = within(canvas.getByRole('region', { name: 'SVG renderer example' }))
    const canvasExample = within(canvas.getByRole('region', { name: 'Canvas renderer example' }))
    const motionExample = within(canvas.getByRole('region', { name: 'Motion renderer example' }))
    await expect(svgExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
    await expect(canvasExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
    await expect(motionExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
    await userEvent.click(svgExample.getByRole('button', { name: 'Show exact values' }))
    await userEvent.click(canvasExample.getByRole('button', { name: 'Show exact values' }))
    await userEvent.click(motionExample.getByRole('button', { name: 'Show exact values' }))
    await expect(svgExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
    await expect(canvasExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
    await expect(motionExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
  },
}
