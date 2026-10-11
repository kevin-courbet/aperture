import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart, ChartToolbar, ChartWidget, chartData } from '@kevin-courbet/aperture'

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

const meta = {
  title: 'Composition/Chart toolbar',
  component: BarChart,
  args: chartProps,
  parameters: { docs: { description: { component: 'One toolbar holds full screen and the optional data button. Button visibility and table visibility are independent.' } } },
} satisfies Meta<typeof BarChart>
export default meta

export const HiddenDataButton: StoryObj<typeof meta> = {}
export const VisibleDataButton: StoryObj<typeof meta> = { args: { dataTableControl: 'visible' } }
export const OpenTable: StoryObj<typeof meta> = { args: { dataTableControl: 'visible', defaultTableVisible: true } }

function ComposedWidget() {
  return (
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
}

export const Composed: StoryObj<typeof meta> = { render: () => <ComposedWidget /> }
