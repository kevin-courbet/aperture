import type { StoryDecorator } from '@ladle/react'

/**
 * Story parameters that the catalog reads. Set them on the default export or
 * on one story.
 */
export interface CatalogParameters {
  /** `demo` renders the adopter page style instead of the paper or night canvas. */
  readonly pageStyle?: 'demo'
  /** Defaults to `reduce`, so screenshots and tests do not depend on motion. */
  readonly reducedMotion?: 'reduce' | 'no-preference'
  /** Set to `false` to omit the story from the story tests. */
  readonly test?: false
}

/** Paints the catalog canvas behind every story. A `theme` argument selects paper or night. */
export const withCatalogCanvas: StoryDecorator = (Story, context) => {
  const parameters = context.parameters as CatalogParameters
  const theme = String(context.args.theme ?? 'paper')
  const className = parameters.pageStyle === 'demo'
    ? 'catalog-canvas catalog-canvas--demo'
    : `catalog-canvas catalog-canvas--${theme}`
  return (
    <div className={className} data-reduced-motion={parameters.reducedMotion ?? 'reduce'}>
      <Story />
    </div>
  )
}

export interface PlayContext<Args = Record<string, unknown>> {
  /** The element that contains the decorated story. */
  readonly canvasElement: HTMLElement
  readonly args: Args
}

/**
 * Interaction test for the story with the same export name. Plays live in
 * `*.play.ts` files, so Ladle does not bundle the test libraries.
 */
export type Play<Args = Record<string, unknown>> = (context: PlayContext<Args>) => Promise<void>
