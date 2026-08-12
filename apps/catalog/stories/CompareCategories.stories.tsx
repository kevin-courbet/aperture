import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarVariantExample, ChartExample, defaultControls, primitiveArgTypes } from './components/ChartExamples'
const meta = { title: 'Charts/Compare categories', component: ChartExample, args: defaultControls, argTypes: primitiveArgTypes, parameters: { docs: { description: { component: 'Compare category values from a common baseline.' } } } } satisfies Meta<typeof ChartExample>
export default meta
type ChartStory = StoryObj<typeof meta>
export const BarChart: ChartStory = { args: { name: 'BarChart' } }
export const HorizontalBars: StoryObj<typeof BarVariantExample> = { render: () => <BarVariantExample layout="single" orientation="horizontal" /> }
export const GroupedBars: StoryObj<typeof BarVariantExample> = { render: () => <BarVariantExample layout="grouped" orientation="vertical" /> }
export const StackedBars: StoryObj<typeof BarVariantExample> = { render: () => <BarVariantExample layout="stacked" orientation="vertical" /> }
