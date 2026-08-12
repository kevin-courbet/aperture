import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Aperture chart catalog',
    brandUrl: '/',
    colorPrimary: '#9d3518',
    colorSecondary: '#1d5b55',
    appBg: '#e8e2d4',
    appContentBg: '#f7f2e7',
    appBorderColor: '#b9af9d',
    textColor: '#28261f',
    textMutedColor: '#645f54',
    fontBase: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    fontCode: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  }),
})
