import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const MonthEndCandlesticks: Play = async ({ canvasElement }) => {
  await expect(within(canvasElement).getByRole('img', { name: 'Month-end market range' })).toBeVisible()
}
