import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const ExactValueDisclosure: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const widgetHeader = canvas.getByRole('heading', { name: 'Completed work and exact values' }).closest('header')
  if (!widgetHeader) throw new Error('The linked-table widget header is missing.')
  const widgetControls = within(widgetHeader)
  await userEvent.click(widgetControls.getByRole('button', { name: 'Show exact values' }))
  await expect(canvas.getByRole('table', { name: 'Exact chart values' })).toBeVisible()
  await expect(canvas.getByRole('cell', { name: '61' })).toBeVisible()
  await expect(widgetControls.getByRole('button', { name: 'Hide exact values' })).toHaveAttribute('aria-pressed', 'true')
}
