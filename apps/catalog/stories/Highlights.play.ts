import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const RangesEventsBandsAndCells: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const line = canvas.getByRole('img', { name: 'Completed work with highlights' })
  await expect(line.querySelector('desc')).toHaveTextContent('Highlights: Hiring freeze, 1 Feb 2025 – 1 Mar 2025; New intake process, 1 Apr 2025.')
  await expect(canvas.getByText(/Contract renewal: Partner/)).toBeVisible()
  await expect(canvas.getByText(/Release day: Export · Mon/)).toBeVisible()
}
