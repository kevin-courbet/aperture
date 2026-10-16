import type { Story, StoryDefault } from '@ladle/react'
import { BarChart, ChartToolbar, ChartWidget, chartData } from '@kevin-courbet/aperture'
import { withCatalogCanvas } from '../src/story'

const data = chartData([
  { id: 'jan-pipe', category: 'January', series: 'Pipe', value: 120 },
  { id: 'jan-signed', category: 'January', series: 'Signed', value: 85 },
  { id: 'feb-pipe', category: 'February', series: 'Pipe', value: 105 },
  { id: 'feb-signed', category: 'February', series: 'Signed', value: 95 },
])
const chartProps = {
  ariaLabel: 'Monthly sales example',
  ariaDescription: 'Fictional pipeline and signed amounts in thousands of euros.',
  orientation: 'vertical',
  layout: 'grouped',
  seriesOrder: ['Pipe', 'Signed'],
  categoryLabel: 'Month',
  valueLabel: 'EUR thousands',
  state: data,
} as const

interface ToolbarArgs {
  readonly dataTableControl: 'hidden' | 'visible'
  readonly defaultTableVisible: boolean
}

export default {
  title: 'Composition/Chart toolbar',
  args: { dataTableControl: 'hidden', defaultTableVisible: false },
  argTypes: {
    dataTableControl: { control: { type: 'inline-radio' }, options: ['hidden', 'visible'] },
  },
  decorators: [withCatalogCanvas],
  meta: { description: 'One toolbar holds full screen and the optional data button. Button visibility and table visibility are independent.' },
} satisfies StoryDefault<ToolbarArgs>

type ToolbarStory = Story<ToolbarArgs>

export const HiddenDataButton: ToolbarStory = (args) => <BarChart {...chartProps} {...args} />

export const VisibleDataButton: ToolbarStory = (args) => <BarChart {...chartProps} {...args} />
VisibleDataButton.args = { dataTableControl: 'visible' }

export const OpenTable: ToolbarStory = (args) => <BarChart {...chartProps} {...args} />
OpenTable.args = { dataTableControl: 'visible', defaultTableVisible: true }

export const Composed: Story = () => (
  <ChartWidget.Root ariaLabel="Monthly sales widget" exactValues="available">
    <ChartWidget.Header><ChartWidget.Title>Monthly sales example</ChartWidget.Title></ChartWidget.Header>
    <ChartToolbar dataTableControl="visible" />
    <ChartWidget.Summary>
      <ChartWidget.Metric value="€200k" description="€10k more than January." />
      <ChartWidget.Details items={[{ label: 'Pipeline', value: '€105k' }, { label: 'Signed', value: '€95k' }]} />
    </ChartWidget.Summary>
    <ChartWidget.Plot><BarChart {...chartProps} /></ChartWidget.Plot>
  </ChartWidget.Root>
)
