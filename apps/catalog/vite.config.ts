import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const chartSource = (path: string) =>
  fileURLToPath(new URL(`../../packages/charts/src/${path}`, import.meta.url))

// Ladle adds the React plugin. Ladle and the story tests render the package
// source, so the catalog shows changes without a package build.
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^@kevin-courbet\/aperture\/styles\.css$/, replacement: chartSource('styles.css') },
      { find: /^@kevin-courbet\/aperture\/tanstack$/, replacement: chartSource('tanstack.tsx') },
      { find: /^@kevin-courbet\/aperture$/, replacement: chartSource('index.ts') },
    ],
  },
  optimizeDeps: {
    exclude: ['@tanstack/charts/mark/decorative'],
  },
  server: { open: false, strictPort: true },
  preview: { strictPort: true },
})
