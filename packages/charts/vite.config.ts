import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [{
    name: 'aperture-inject-styles',
    generateBundle(_options, bundle) {
      const entry = bundle['browser.js']
      if (entry?.type === 'chunk') entry.code = `import './styles.css';\n${entry.code}`
    },
  }],
  build: {
    lib: {
      entry: {
        browser: 'src/browser.ts',
        index: 'src/index.ts',
        tanstack: 'src/tanstack.tsx',
      },
      cssFileName: 'styles',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        /^@tanstack\/charts(?:\/.*)?$/,
        /^react(?:\/.*)?$/,
        /^react-dom(?:\/.*)?$/,
        /^react-aria-components(?:\/.*)?$/,
        /^lucide-react(?:\/.*)?$/,
        /^d3-scale(?:\/.*)?$/,
        /^@fontsource-variable\/ibm-plex-sans(?:\/.*)?$/,
      ],
    },
  },
})
