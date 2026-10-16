import { waitFor, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

async function expectFocusedGroupTotal(canvasElement: HTMLElement, chartName: string) {
  const canvas = within(canvasElement)
  const chart = canvas.getByRole('img', { name: chartName })
  chart.focus()
  await userEvent.keyboard('{ArrowRight}')
  await waitFor(() => expect(canvas.getByText(/Total:/)).toBeVisible())
  const total = canvas.getByText(/Total:/)
  await expect(total).toHaveTextContent('Total: 277 items')
}

export const GroupedBars: Play = ({ canvasElement }) => expectFocusedGroupTotal(canvasElement, 'grouped vertical bars')

export const HorizontalGroupedBars: Play = ({ canvasElement }) => expectFocusedGroupTotal(canvasElement, 'grouped horizontal bars')
