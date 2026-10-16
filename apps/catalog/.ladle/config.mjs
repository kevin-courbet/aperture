import { fileURLToPath } from 'node:url'

/** @satisfies {import('@ladle/react').UserConfig} */
const config = {
  stories: 'stories/**/*.stories.tsx',
  host: '127.0.0.1',
  port: 6006,
  previewHost: '127.0.0.1',
  previewPort: 6006,
  outDir: 'ladle-static',
  defaultStory: 'demo--overview--adopter-overview',
  viteConfig: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  // The catalog canvas sets its own padding and background.
  appendToHead: '<style>:root { --ladle-main-padding: 0; --ladle-main-padding-mobile: 0; }</style>',
  addons: {
    a11y: { enabled: true },
    action: { enabled: false },
    control: { enabled: true },
    mode: { enabled: true },
    msw: { enabled: false },
    rtl: { enabled: false },
    source: { enabled: true },
    // The catalog theme is a story argument, so the Ladle theme toggle has no effect.
    theme: { enabled: false },
    width: {
      enabled: true,
      options: { 'compact mobile': 390, 'working desktop': 1440 },
      defaultState: 0,
    },
  },
  onDevServerStart(serverUrl) {
    if (new URL(serverUrl).port !== '6006') {
      throw new Error(`The catalog requires port 6006. Ladle attempted to use ${serverUrl}.`)
    }
  },
}

export default config
