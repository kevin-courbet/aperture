import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const TilesAndSparklines: Play = async ({ canvasElement }) => {
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
}
