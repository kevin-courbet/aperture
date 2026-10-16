import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const PresentationControls: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('status')).toHaveTextContent('Showing 6 monthly values')
  await userEvent.click(canvas.getByRole('radio', { name: '3 months' }))
  await expect(canvas.getByRole('status')).toHaveTextContent('Showing 3 monthly values')
  await userEvent.click(canvas.getByRole('button', { name: 'Show exact values' }))
  const table = canvas.getByRole('table', { name: 'Exact chart values' })
  await expect(within(table).getAllByRole('row')).toHaveLength(4)
  await expect(canvas.getByRole('button', { name: 'Enter full screen' })).toBeEnabled()
}
