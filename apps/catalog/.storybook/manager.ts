import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Aperture chart catalog',
    brandUrl: '/',
    colorPrimary: '#9d3518',
    colorSecondary: '#1d5b55',
    appBg: '#f4f5f6',
    appContentBg: '#fdfdfc',
    appBorderColor: '#cdd2d8',
    textColor: '#20242a',
    textMutedColor: '#5f6670',
    fontBase: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    fontCode: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  }),
})
