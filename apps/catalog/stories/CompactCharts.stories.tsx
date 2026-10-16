import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { CompactExamples } from './components/CompactExamples'

const meta = {
  title: 'Charts/Compact charts',
  component: CompactExamples,
  parameters: { controls: { disable: true }, docs: { description: { component: 'A compact AreaChart or LineChart sits in a stat tile. It draws no axes, grid lines, legend, or standalone controls. The tooltip and the exact-value table stay available.' } } },
} satisfies Meta<typeof CompactExamples>
export default meta

export const InStatTiles: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [tileName, chartName] of [
      ['Completed items · June 2025', 'Completed items by month'],
      ['Queued items · June 2025', 'Queued items by month'],
    ] as const) {
      const tile = within(canvas.getByRole('region', { name: tileName }))
      const chart = tile.getByRole('img', { name: chartName })
      const root = chart.closest('[data-aperture-root].aperture-compact')
      if (!(root instanceof HTMLElement)) throw new Error(`${chartName} has no compact Aperture root.`)
      await expect(tile.queryByRole('button')).toBeNull()
      await expect(root.querySelector('.aperture-legend')).toBeNull()
      await expect(chart.querySelectorAll('text')).toHaveLength(0)
      const table = tile.getByRole('table', { hidden: true })
      await expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(7)
    }
  },
}

export const HostOverridesDarkTheme: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvasElement.setAttribute('data-theme', 'dark')
    const chart = canvas.getByRole('img', { name: 'Completed items by month' })
    const root = chart.closest('[data-aperture-root].aperture-compact')
    if (!(root instanceof HTMLElement)) throw new Error('The compact chart has no Aperture root.')
    const host = canvasElement.ownerDocument.createElement('style')
    host.textContent = '.catalog-host-bridge { --aperture-color-surface: rgb(1, 2, 3); }'
    canvasElement.ownerDocument.head.append(host)
    root.classList.add('catalog-host-bridge')
    try {
      // The host rule has lower specificity than the Aperture dark-theme rule. The cascade layer lets it win.
      await expect(getComputedStyle(root).getPropertyValue('--aperture-color-surface').trim()).toBe('rgb(1, 2, 3)')
    } finally {
      root.classList.remove('catalog-host-bridge')
      host.remove()
      canvasElement.removeAttribute('data-theme')
    }
  },
}
