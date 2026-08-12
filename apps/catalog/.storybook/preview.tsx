import type { Preview } from '@storybook/react-vite'
import '@kevin-courbet/aperture/styles.css'
import '../src/catalog.css'

const preview: Preview = {
  tags: ['autodocs', 'test'],
  decorators: [
    (Story, context) => (
      <div className={context.parameters.pageStyle === 'demo' ? 'catalog-canvas catalog-canvas--demo' : `catalog-canvas catalog-canvas--${String(context.args.theme ?? 'paper')}`} data-reduced-motion={String(context.parameters.reducedMotion ?? 'reduce')}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    a11y: {
      test: 'error',
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      },
    },
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
    options: {
      storySort: {
        order: ['Demo', 'Foundations', 'Charts', 'Interactions', 'States'],
      },
    },
    viewport: {
      options: {
        compactMobile: {
          name: 'Compact mobile · 390 × 844',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        workingDesktop: {
          name: 'Working desktop · 1440 × 960',
          styles: { width: '1440px', height: '960px' },
          type: 'desktop',
        },
      },
    },
    reducedMotion: 'reduce',
  },
  initialGlobals: {
    viewport: { value: 'workingDesktop', isRotated: false },
  },
}

export default preview
