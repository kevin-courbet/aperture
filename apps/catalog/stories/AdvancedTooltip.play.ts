import { waitFor, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const CustomReactBody: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const chart = canvas.getByRole('img', { name: 'Advanced completed work' })
  chart.focus()
  await userEvent.keyboard('{ArrowRight}')
  await waitFor(() => expect(canvas.getByText('Advanced selected records: 1')).toBeVisible())
  const tooltip = canvas.getByRole('status')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveTextContent('Month 2: 48 items')
}
