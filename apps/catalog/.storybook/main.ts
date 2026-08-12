import type { StorybookConfig } from '@storybook/react-vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const chartSource = (path: string) =>
  fileURLToPath(new URL(`../../../packages/charts/src/${path}`, import.meta.url))

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  features: {
    experimentalDocgenServer: true,
  },
  viteFinal: (config) =>
    mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^@kevin-courbet\/aperture\/styles\.css$/,
            replacement: chartSource('styles.css'),
          },
          {
            find: /^@kevin-courbet\/aperture\/tanstack$/,
            replacement: chartSource('tanstack.tsx'),
          },
          {
            find: /^@kevin-courbet\/aperture$/,
            replacement: chartSource('index.ts'),
          },
        ],
      },
    }),
}

export default config
