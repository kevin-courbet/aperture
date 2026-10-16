import type { Story, StoryDecorator, StoryDefault } from '@ladle/react'
import axe from 'axe-core'
import { act, type FC, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, test } from 'vitest'
import { page } from 'vitest/browser'
import '@kevin-courbet/aperture/styles.css'
import '../src/catalog.css'
import type { CatalogParameters, Play } from '../src/story'

type StoryArgs = Record<string, unknown>
type StoryModule = Record<string, unknown> & { readonly default?: StoryDefault<StoryArgs> }
type PlayModule = Record<string, Play>

const desktopViewport = { width: 1440, height: 960 }
const accessibilityTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const storyModules = import.meta.glob<StoryModule>('../stories/*.stories.tsx', { eager: true })
const playModules = import.meta.glob<PlayModule>('../stories/*.play.ts', { eager: true })

// These functions copy the Ladle 5.1.1 story naming, so each test name is the Ladle story ID.
const wordSeparators = /[\s -⁯⸀-⹿\\'!"#$%&()*+,.\/:;<=>?@\[\]^_`{|}~]+/
const kebabCase = (value: string) => value
  .replace(/[A-ZÀ-ÖÙ-Ý]+(?![a-z])|[A-ZÀ-ÖÙ-Ý]/g, (match, offset: number) => (offset ? '-' : '') + match.toLowerCase())
  .replace(/\s-/g, '-')
  .trim()
  .split(wordSeparators)
  .join('-')
const titleToFileId = (title: string) => title
  .toLocaleLowerCase()
  .replace(/\s*\/\s*/g, '--')
  .replace(/\s+/g, '-')

interface StoryEntry {
  readonly id: string
  readonly defaults: StoryDefault<StoryArgs>
  readonly story: Story<StoryArgs>
  readonly play: Play | undefined
}

function storyEntries(): readonly StoryEntry[] {
  for (const path of Object.keys(playModules)) {
    if (storyModules[path.replace(/\.play\.ts$/, '.stories.tsx')] === undefined) {
      throw new Error(`${path} has no matching story file.`)
    }
  }
  return Object.entries(storyModules).flatMap(([path, module]) => {
    const defaults = module.default
    if (defaults?.title === undefined) throw new Error(`${path} needs a default export with a title.`)
    const plays = playModules[path.replace(/\.stories\.tsx$/, '.play.ts')] ?? {}
    const stories = Object.entries(module).filter(([name]) => name !== 'default')
    for (const name of Object.keys(plays)) {
      if (!stories.some(([storyName]) => storyName === name)) throw new Error(`${path} has a play for ${name}, which is not a story.`)
    }
    return stories.map(([exportName, story]) => {
      if (typeof story !== 'function') throw new Error(`${path} exports ${exportName}, which is not a story component.`)
      const typedStory = story as Story<StoryArgs>
      const id = `${kebabCase(titleToFileId(defaults.title!))}--${kebabCase(typedStory.storyName ?? exportName)}`
      return { id, defaults, story: typedStory, play: plays[exportName] }
    })
  })
}

let root: Root | undefined
let container: HTMLElement | undefined

/** React warns about updates outside act only while this flag is set, so plays run with it cleared. */
async function inAct(callback: () => void) {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  environment.IS_REACT_ACT_ENVIRONMENT = true
  try {
    await act(async () => callback())
  } finally {
    environment.IS_REACT_ACT_ENVIRONMENT = false
  }
}

afterEach(async () => {
  const mounted = root
  if (mounted !== undefined) await inAct(() => mounted.unmount())
  container?.remove()
  root = undefined
  container = undefined
  await page.viewport(desktopViewport.width, desktopViewport.height)
})

function decoratedStory({ defaults, story }: StoryEntry, args: StoryArgs, parameters: CatalogParameters): ReactElement {
  // Catalog decorators read only args and parameters. Ladle also passes its global state.
  const context = {
    args,
    argTypes: { ...defaults.argTypes, ...story.argTypes },
    parameters,
  } as unknown as Parameters<StoryDecorator>[1]
  const StoryComponent = story as FC<StoryArgs>
  let Decorated: FC = () => <StoryComponent {...args} />
  // Ladle applies story decorators inside the decorators of the default export.
  for (const decorator of [...(story.decorators ?? []), ...(defaults.decorators ?? [])]) {
    const Inner = Decorated
    Decorated = () => decorator(Inner, context)
  }
  return <Decorated />
}

for (const entry of storyEntries()) {
  const parameters = { ...entry.defaults.parameters, ...entry.story.parameters } as CatalogParameters
  test.skipIf(parameters.test === false)(entry.id, async () => {
    const width = entry.story.meta?.width
    if (typeof width === 'number') await page.viewport(width, desktopViewport.height)
    else if (width !== undefined) throw new Error(`${entry.id} must set meta.width in pixels.`)
    const args = { ...entry.defaults.args, ...entry.story.args }
    const element = document.createElement('div')
    document.body.append(element)
    container = element
    const mounted = createRoot(element)
    root = mounted
    await inAct(() => mounted.render(decoratedStory(entry, args, parameters)))

    const results = await axe.run(element, { runOnly: { type: 'tag', values: accessibilityTags } })
    const violations = results.violations.map((violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(', ')})`)
    if (violations.length) throw new Error(`Accessibility violations:\n${violations.join('\n')}`)

    await entry.play?.({ canvasElement: element, args })
  })
}
