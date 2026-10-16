import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  // Story modules load through import.meta.glob, which the dependency scan does not
  // follow. Listing their dependencies prevents a reload during the first run.
  optimizeDeps: {
    include: [
      '@internationalized/date',
      '@tanstack/charts',
      '@tanstack/charts/d3/shape',
      '@tanstack/charts/geo',
      '@tanstack/charts/hierarchy/sunburst',
      '@tanstack/charts/hierarchy/treemap',
      '@tanstack/charts/interaction/brush',
      '@tanstack/charts/interaction/signal',
      '@tanstack/charts/interaction/zoom',
      '@tanstack/charts/motion',
      '@tanstack/charts/network/force',
      '@tanstack/charts/network/sankey',
      '@tanstack/charts/polar',
      '@tanstack/charts/react/tooltip',
      '@tanstack/charts/scales/band',
      '@tanstack/charts/scales/linear',
      '@tanstack/charts/scales/point',
      '@tanstack/charts/selection',
      '@tanstack/charts/spatial/density',
      '@tanstack/charts/tooltip',
      '@testing-library/dom',
      '@testing-library/user-event',
      'axe-core',
      'd3-geo',
      'd3-scale',
      'd3-shape',
      'lucide-react',
      'react',
      'react-aria-components',
      'react-dom/client',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
    ],
  },
  test: {
    name: 'stories',
    include: ['tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30_000,
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      // The working desktop size. A story sets meta.width for a narrower viewport.
      viewport: { width: 1440, height: 960 },
      instances: [{ browser: 'chromium' }],
    },
  },
}))
