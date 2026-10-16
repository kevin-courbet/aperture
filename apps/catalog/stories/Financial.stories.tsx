import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { ChartExample, type ChartExampleProps, defaultControls, MonthEndCandlestickExample, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Financial',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Show changes, totals, and market ranges with explicit units.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const WaterfallChart: ChartStory = (args) => <ChartExample {...args} />
WaterfallChart.args = { name: 'WaterfallChart' }

export const CandlestickChart: ChartStory = (args) => <ChartExample {...args} />
CandlestickChart.args = { name: 'CandlestickChart' }

export const MonthEndCandlesticks: Story = () => <MonthEndCandlestickExample />
