import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ChartExample, defaultControls, MonthEndCandlestickExample, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Financial', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Show changes, totals, and market ranges with explicit units.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const WaterfallChart: ChartStory = { args: { name: 'WaterfallChart' } }
export const CandlestickChart: ChartStory = { args: { name: 'CandlestickChart' } }
export const MonthEndCandlesticks: ChartStory = {
  args: { name: 'CandlestickChart' },
  render: () => <MonthEndCandlestickExample />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Month-end market range' })).toBeVisible()
  },
}
