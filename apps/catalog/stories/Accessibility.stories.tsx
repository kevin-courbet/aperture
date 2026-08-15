import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { StateGallery, UnavailableExactValueExample } from './components/ChartExamples'
const meta = { title: 'States/Accessibility', component: StateGallery, args: { mode: 'accessibility' }, parameters: { controls: { disable: true }, docs: { description: { component: 'Accessible names, keyboard controls, visible focus, and exact values are part of the chart output.' } } } } satisfies Meta<typeof StateGallery>
export default meta
export const ExactValuesAndFocus: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const widgetHeader = canvas.getByRole('heading', { name: 'Completed work and exact values' }).closest('header')
    if (!widgetHeader) throw new Error('The exact-value widget header is missing.')
    await userEvent.click(within(widgetHeader).getByRole('button', { name: 'Show exact values' }))
    await expect(canvas.getByRole('table', { name: 'Exact chart values' })).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: 'Value' })).toBeVisible()
    const table = canvas.getByRole('table', { name: 'Exact chart values' })
    await expect(within(table).getByRole('cell', { name: '57' })).toBeVisible()
    const chart = canvas.getByRole('img', { name: 'Completed work by month' })
    within(widgetHeader).getByRole('button', { name: 'Hide exact values' }).focus()
    await userEvent.tab()
    await expect(chart).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(chart).toHaveFocus()
  },
}
export const ExactValuesUnavailable: StoryObj<typeof meta> = {
  render: () => <UnavailableExactValueExample />,
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('button', { name: 'Show exact values' })
    await expect(control).toBeDisabled()
    await expect(control).not.toHaveAttribute('aria-controls')
  },
}
