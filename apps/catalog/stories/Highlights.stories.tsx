import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { HighlightExamples } from './components/AnnotationExamples'

const meta = {
  title: 'Interactions/Highlights',
  component: HighlightExamples,
  parameters: { controls: { disable: true }, docs: { description: { component: 'Highlights draw labeled time ranges, events, category bands, and cell outlines behind the data. The legend and the accessible description name each highlight.' } } },
} satisfies Meta<typeof HighlightExamples>
export default meta

export const RangesEventsBandsAndCells: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const line = canvas.getByRole('img', { name: 'Completed work with highlights' })
    await expect(line.querySelector('desc')).toHaveTextContent('Highlights: Hiring freeze, 1 Feb 2025 – 1 Mar 2025; New intake process, 1 Apr 2025.')
    await expect(canvas.getByText(/Contract renewal: Partner/)).toBeVisible()
    await expect(canvas.getByText(/Release day: Export · Mon/)).toBeVisible()
  },
}
