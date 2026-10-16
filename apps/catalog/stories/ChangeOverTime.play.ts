import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const ObservationDates: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const chart = within(canvas.getByRole('img', { name: 'Completed work by month' }))
  await expect(chart.getByText('15 Jan 2025')).toBeVisible()
  await expect(chart.getByText('15 Feb')).toBeVisible()
  await expect(chart.getByText('15 Mar')).toBeVisible()
}
