import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const IntervalSelection: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const start = canvas.getByRole('slider', { name: 'Range start' })
  start.focus()
  await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}')
  await expect(canvas.getByRole('status')).toHaveTextContent('Selected months: Feb 2025 to Apr 2025')
  const reset = canvas.getByRole('button', { name: 'Reset range' })
  await expect(reset).toBeEnabled()
  await userEvent.click(reset)
  await expect(canvas.getByRole('status')).toHaveTextContent('Selected months: Jan 2025 to Apr 2025')
  await expect(reset).toBeDisabled()
}
