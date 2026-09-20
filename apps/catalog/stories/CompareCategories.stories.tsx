import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { BarVariantExample, ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Compare categories', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Compare category values from a common baseline.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const BarChart: ChartStory = { args: { name: 'BarChart' } }
export const HorizontalBars: StoryObj<typeof BarVariantExample> = { render: () => <BarVariantExample layout="single" orientation="horizontal" /> }
export const GroupedBars: StoryObj<typeof BarVariantExample> = {
  render: () => <BarVariantExample layout="grouped" orientation="vertical" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chart = canvas.getByRole('img', { name: 'grouped vertical bars' })
    chart.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByText(/Total:/)).toBeVisible())
    const total = canvas.getByText(/Total:/)
    await expect(total).toHaveTextContent('Total: 277 items')
  },
}
export const HorizontalGroupedBars: StoryObj<typeof BarVariantExample> = {
  render: () => <BarVariantExample layout="grouped" orientation="horizontal" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chart = canvas.getByRole('img', { name: 'grouped horizontal bars' })
    chart.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByText(/Total:/)).toBeVisible())
    const total = canvas.getByText(/Total:/)
    await expect(total).toHaveTextContent('Total: 277 items')
  },
}
export const StackedBars: StoryObj<typeof BarVariantExample> = { render: () => <BarVariantExample layout="stacked" orientation="vertical" /> }
