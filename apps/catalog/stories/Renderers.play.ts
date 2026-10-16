import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const SvgAndCanvas: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const svgExample = within(canvas.getByRole('region', { name: 'SVG renderer example' }))
  const canvasExample = within(canvas.getByRole('region', { name: 'Canvas renderer example' }))
  const motionExample = within(canvas.getByRole('region', { name: 'Motion renderer example' }))
  await expect(svgExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
  await expect(canvasExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
  await expect(motionExample.getByRole('img', { name: 'Effort and outcome' })).toBeVisible()
  await expect(svgExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
  await expect(canvasExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
  await expect(motionExample.getByRole('table', { name: 'Exact chart values' })).toHaveTextContent('Control2.141')
}
