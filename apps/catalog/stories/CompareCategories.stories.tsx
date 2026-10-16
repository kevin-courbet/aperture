import type { Story, StoryDefault } from '@ladle/react'
import { withCatalogCanvas } from '../src/story'
import { BarVariantExample, ChartExample, type ChartExampleProps, defaultControls, primitiveArgTypes } from './components/ChartExamples'

export default {
  title: 'Charts/Compare categories',
  args: defaultControls,
  argTypes: primitiveArgTypes,
  decorators: [withCatalogCanvas],
  meta: { description: 'Compare category values from a common baseline.' },
} satisfies StoryDefault<ChartExampleProps>

type ChartStory = Story<ChartExampleProps>

export const BarChart: ChartStory = (args) => <ChartExample {...args} />
BarChart.args = { name: 'BarChart' }

export const HorizontalBars: Story = () => <BarVariantExample layout="single" orientation="horizontal" />
export const GroupedBars: Story = () => <BarVariantExample layout="grouped" orientation="vertical" />
export const HorizontalGroupedBars: Story = () => <BarVariantExample layout="grouped" orientation="horizontal" />

export const Dumbbell: ChartStory = (args) => <ChartExample {...args} />
Dumbbell.args = { name: 'DumbbellChart' }

export const StackedBars: Story = () => <BarVariantExample layout="stacked" orientation="vertical" />
