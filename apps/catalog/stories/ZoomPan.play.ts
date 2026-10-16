import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const DomainNavigation: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const zoomSurface = canvas.getByRole('application', { name: 'Completed work zoom surface' })
  zoomSurface.focus()
  await userEvent.keyboard('+')
  await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 2.3 to 4.8; 2 values')
  await userEvent.keyboard('{ArrowRight}')
  await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 2.6 to 5.1; 3 values')
  const reset = canvas.getByRole('button', { name: 'Reset zoom' })
  await expect(reset).toBeEnabled()
  await userEvent.click(reset)
  await expect(canvas.getByRole('status')).toHaveTextContent('Visible months: 1.0 to 6.0; 6 values')
  await expect(reset).toBeDisabled()
}
