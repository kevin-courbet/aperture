import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { StatExamples } from './components/StatExamples'

const meta = {
  title: 'Charts/Headline figures',
  component: StatExamples,
  parameters: { controls: { disable: true }, docs: { description: { component: 'StatTile shows one number with its change from an earlier period. Sparkline shows the recent trend without axes. The arrow, sign, and screen-reader text carry direction; color shows whether the change is good.' } } },
} satisfies Meta<typeof StatExamples>
export default meta

export const TilesAndSparklines: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const completed = canvas.getByRole('region', { name: 'Completed items · June 2025' })
    await expect(completed).toHaveTextContent('58')
    await expect(completed).toHaveTextContent('Decrease of 3, worse, vs May 2025')
    const queued = canvas.getByRole('region', { name: 'Queued items · June 2025' })
    await expect(queued).toHaveTextContent('Increase of 3, worse, vs May 2025')
    const sparkline = within(completed).getByRole('img', { name: 'Completed items by month' })
    await expect(sparkline.querySelector('desc')).toHaveTextContent('From 42 on 1 Jan 2025 to 58 on 1 Jun 2025. Lowest 42. Highest 61.')
    await expect(within(completed).getByRole('table', { hidden: true })).toBeInTheDocument()
    await expect(canvas.getByRole('status', { name: 'Refund rate · June 2025' })).toHaveTextContent('Data is loading.')
  },
}
