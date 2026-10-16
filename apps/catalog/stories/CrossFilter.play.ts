import { waitFor, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { Play } from '../src/story'

export const SelectAndClear: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const channelTable = () => within(canvas.getByRole('img', { name: 'Orders by channel' }).closest('.aperture-chart') as HTMLElement).getByRole('table', { hidden: true })
  await expect(within(channelTable()).getByRole('row', { name: /Direct Value 262/ })).toBeInTheDocument()

  const regionChart = canvas.getByRole('img', { name: 'Orders by region' })
  regionChart.focus()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/Active filters: Region (North|Central|South)\./))
  const selected = /Region (\w+)\./.exec(canvas.getByRole('status').textContent ?? '')?.[1]
  if (selected === undefined) throw new Error('No region was selected.')
  await expect(regionChart.querySelector('desc')).toHaveTextContent(`Selected: ${selected}.`)
  await expect(canvas.getByRole('button', { name: /Region$/ })).toHaveTextContent(selected)

  await userEvent.click(canvas.getByRole('button', { name: `Remove filter: Region ${selected}` }))
  await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('No filters applied.'))

  await userEvent.click(canvas.getByRole('button', { name: /Channel$/ }))
  await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole('option', { name: 'Partner' }))
  await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Active filters: Channel Partner.'))
  const regionTable = within(regionChart.closest('.aperture-chart') as HTMLElement).getByRole('table', { hidden: true })
  await expect(within(regionTable).getByRole('row', { name: /Central Value 97/ })).toBeInTheDocument()
}

export const ControlledByUrl: Play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const query = canvas.getByRole('status', { name: 'Application URL query' })
  await expect(query).toHaveTextContent('?channel=Partner')
  await expect(canvas.getByRole('button', { name: /Channel$/ })).toHaveTextContent('Partner')
  await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Channel Partner' }))
  await waitFor(() => expect(query).toHaveTextContent('(no query)'))
  await userEvent.click(canvas.getByRole('button', { name: 'Open link with region South' }))
  await waitFor(() => expect(canvas.getByRole('button', { name: /Region$/ })).toHaveTextContent('South'))
  const regionChart = canvas.getByRole('img', { name: 'Orders by region' })
  await expect(regionChart.querySelector('desc')).toHaveTextContent('Selected: South.')
}
