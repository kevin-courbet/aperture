import { waitFor, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const KeyboardAndPointer: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await expect(canvas.queryByRole('button', { name: 'Show exact values' })).toBeNull()
  const legend = canvas.getByRole('list', { name: 'Chart legend' })
  await expect(within(legend).getByText(/Goal/)).toHaveTextContent('Goal: 55')
  const chart = canvas.getByRole('img', { name: 'Completed work focus example' })
  await expect(chart).toHaveAttribute('tabindex', '0')
  chart.focus()
  await expect(chart).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await expect(chart).toHaveFocus()
  const bounds = chart.getBoundingClientRect()
  const clientX = bounds.left + bounds.width * 0.05
  const clientY = bounds.top + bounds.height * 0.81
  const pointerTarget = chart.ownerDocument.elementFromPoint(clientX, clientY)
  if (!pointerTarget) throw new Error('The chart pointer target is not available.')
  await userEvent.pointer({
    target: pointerTarget,
    coords: { clientX, clientY },
  })
  await waitFor(() => expect(canvas.getByText('Selected records: 1')).toBeVisible())
  const tooltip = canvas.getByRole('status')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveTextContent('1 Jan 2025, 00:00 UTC: 42')
  const table = canvas.getByRole('table', { name: 'Exact chart values' })
  await expect(within(table).getByRole('cell', { name: '57' })).toBeInTheDocument()
}
