import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoPage } from './components/DemoPage'
import '../src/demo.css'

const meta = {
  title: 'Demo/Overview',
  component: DemoPage,
  parameters: {
    controls: { disable: true },
    layout: 'fullscreen',
    pageStyle: 'demo',
    docs: { description: { component: 'A single adopter-focused overview of the Aperture product, API, chart breadth, and theme integration.' } },
  },
} satisfies Meta<typeof DemoPage>

export default meta
type Story = StoryObj<typeof meta>

export const AdopterOverview: Story = {}
