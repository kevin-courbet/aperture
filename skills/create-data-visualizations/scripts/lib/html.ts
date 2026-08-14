import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { diagnostic, type Diagnostic } from './contracts'

type Delivery = 'single-file' | 'bundle'
type Reference = { element: string; attribute: string; reference: string; runtime: boolean }
type Container = { title: boolean; description: boolean; role: string | null }
type ChartRegion = { charts: number; tables: number }

const maxBundleArtifacts = 256
const maxArtifactBytes = 5 * 1024 * 1024

const isEmbedded = (reference: string) =>
  reference.startsWith('#') || reference.startsWith('data:') || reference.startsWith('mailto:') || reference.startsWith('tel:')

const isRemote = (reference: string) => /^(?:https?:)?\/\//i.test(reference)

const splitSrcset = (value: string) =>
  value.split(',').map((candidate) => candidate.trim().split(/\s+/, 1)[0]).filter(Boolean)

const addReference = (
  references: Reference[],
  element: string,
  attribute: string,
  value: string | null,
  runtime: boolean,
) => {
  if (!value) return
  const values = attribute === 'srcset' ? splitSrcset(value) : [value]
  values.forEach((reference) => references.push({ element, attribute, reference, runtime }))
}

const parseHtml = async (html: string) => {
  const references: Reference[] = []
  const svgs: Container[] = []
  const tables: Array<{ caption: boolean }> = []
  const svgStack: number[] = []
  const tableStack: number[] = []
  const regions: ChartRegion[] = []
  const regionStack: number[] = []
  let uncontainedCharts = 0
  let hasLanguage = false
  let hasDocumentTitle = false
  let hasViewport = false
  let hasMain = false

  const rewriter = new HTMLRewriter()
    .on('html', { element: (element) => { hasLanguage ||= Boolean(element.getAttribute('lang')?.trim()) } })
    .on('head > title', { text: (text) => { hasDocumentTitle ||= Boolean(text.text.trim()) } })
    .on('meta[name="viewport"]', { element: () => { hasViewport = true } })
    .on('main, article', { element: () => { hasMain = true } })
    .on('section, figure', {
      element: (element) => {
        const index = regions.push({ charts: 0, tables: 0 }) - 1
        regionStack.push(index)
        element.onEndTag(() => { regionStack.pop() })
      },
    })
    .on('svg', {
      element: (element) => {
        if (element.getAttribute('aria-hidden') === 'true') return
        const region = regionStack.at(-1)
        if (region === undefined) uncontainedCharts += 1
        else regions[region].charts += 1
        const index = svgs.push({ title: false, description: false, role: element.getAttribute('role') }) - 1
        svgStack.push(index)
        element.onEndTag(() => { svgStack.pop() })
      },
    })
    .on('svg title', { text: (text) => { const index = svgStack.at(-1); if (index !== undefined) svgs[index].title ||= Boolean(text.text.trim()) } })
    .on('svg desc', { text: (text) => { const index = svgStack.at(-1); if (index !== undefined) svgs[index].description ||= Boolean(text.text.trim()) } })
    .on('table', {
      element: (element) => {
        const region = regionStack.at(-1)
        if (region !== undefined) regions[region].tables += 1
        const index = tables.push({ caption: false }) - 1
        tableStack.push(index)
        element.onEndTag(() => { tableStack.pop() })
      },
    })
    .on('table caption', { text: (text) => { const index = tableStack.at(-1); if (index !== undefined) tables[index].caption ||= Boolean(text.text.trim()) } })
    .on('script[src]', { element: (element) => addReference(references, 'script', 'src', element.getAttribute('src'), true) })
    .on('img[src]', { element: (element) => addReference(references, 'img', 'src', element.getAttribute('src'), true) })
    .on('img[srcset]', { element: (element) => addReference(references, 'img', 'srcset', element.getAttribute('srcset'), true) })
    .on('link[href]', { element: (element) => addReference(references, 'link', 'href', element.getAttribute('href'), true) })
    .on('iframe[src]', { element: (element) => addReference(references, 'iframe', 'src', element.getAttribute('src'), true) })
    .on('source[src]', { element: (element) => addReference(references, 'source', 'src', element.getAttribute('src'), true) })
    .on('source[srcset]', { element: (element) => addReference(references, 'source', 'srcset', element.getAttribute('srcset'), true) })
    .on('video[src]', { element: (element) => addReference(references, 'video', 'src', element.getAttribute('src'), true) })
    .on('video[poster]', { element: (element) => addReference(references, 'video', 'poster', element.getAttribute('poster'), true) })
    .on('audio[src]', { element: (element) => addReference(references, 'audio', 'src', element.getAttribute('src'), true) })
    .on('object[data]', { element: (element) => addReference(references, 'object', 'data', element.getAttribute('data'), true) })
    .on('embed[src]', { element: (element) => addReference(references, 'embed', 'src', element.getAttribute('src'), true) })
    .on('image, use', {
      element: (element) => {
        addReference(references, element.tagName, 'href', element.getAttribute('href'), true)
        addReference(references, element.tagName, 'xlink:href', element.getAttribute('xlink:href'), true)
      },
    })
    .on('a[href]', { element: (element) => addReference(references, 'a', 'href', element.getAttribute('href'), false) })

  await rewriter.transform(new Response(html)).text()
  return { references, svgs, tables, regions, uncontainedCharts, hasLanguage, hasDocumentTitle, hasViewport, hasMain }
}

const cssReferences = (content: string): Reference[] => {
  const references: Reference[] = []
  const importPattern = /@import\s+(?:url\(\s*)?["']?([^"')\s]+)["']?\s*\)?/gi
  const withoutImports = content.replace(importPattern, (_statement, reference: string) => {
    addReference(references, 'style', 'import', reference, true)
    return ''
  })
  for (const match of withoutImports.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
    addReference(references, 'style', 'url', match[1], true)
  }
  return references
}

const scriptRequestReferences = (content: string): Reference[] => {
  const references: Reference[] = []
  for (const match of content.matchAll(/\b(?:fetch|import|importScripts)\s*\(\s*["']([^"']+)["']/g)) {
    addReference(references, 'script', 'request', match[1], true)
  }
  for (const match of content.matchAll(/\b(?:new\s+(?:URL|Worker|SharedWorker)|navigator\.serviceWorker\.register)\s*\(\s*["']([^"']+)["']/g)) {
    addReference(references, 'script', 'request', match[1], true)
  }
  return references
}

const inlineScriptReferences = (content: string): Reference[] => {
  const references = scriptRequestReferences(content)
  for (const match of content.matchAll(/\b(?:import|export)\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/g)) {
    addReference(references, 'script', 'import', match[1], true)
  }
  return references
}

const inlineReferences = (content: string) => [...cssReferences(content), ...inlineScriptReferences(content)]

const javascriptReferences = (content: string): Reference[] => {
  const references = scriptRequestReferences(content)
  const transpiler = new Bun.Transpiler({ loader: 'js' })
  for (const imported of transpiler.scanImports(content)) {
    addReference(references, 'script', imported.kind, imported.path, true)
  }
  return references
}

const isInside = (root: string, target: string) => {
  const path = relative(root, target)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

export const auditHtml = async (html: string, file: string, delivery: Delivery): Promise<Diagnostic[]> => {
  const diagnostics: Diagnostic[] = []
  const parsed = await parseHtml(html)
  if (!/<!doctype html>/i.test(html)) diagnostics.push(diagnostic('error', 'HTML_DOCTYPE', file, 'Add the HTML5 doctype.'))
  if (!parsed.hasLanguage) diagnostics.push(diagnostic('error', 'HTML_LANGUAGE', file, 'Set the document language.'))
  if (!parsed.hasDocumentTitle) diagnostics.push(diagnostic('error', 'HTML_TITLE', file, 'Add a descriptive document title.'))
  if (!parsed.hasViewport) diagnostics.push(diagnostic('error', 'HTML_VIEWPORT', file, 'Add viewport metadata.'))
  if (!parsed.hasMain) diagnostics.push(diagnostic('error', 'HTML_MAIN', file, 'Add a main or article landmark.'))
  if (parsed.tables.length === 0) diagnostics.push(diagnostic('error', 'HTML_EXACT_VALUES', file, 'Add an HTML exact-value table.'))
  parsed.tables.forEach((table, index) => {
    if (!table.caption) diagnostics.push(diagnostic('error', 'HTML_TABLE_CAPTION', `table[${index}]`, 'Add a non-empty caption to each exact-value table.'))
  })
  parsed.svgs.forEach((svg, index) => {
    if (svg.role !== 'img') diagnostics.push(diagnostic('error', 'HTML_SVG_ROLE', `svg[${index}]`, 'Give each analytical SVG role="img".'))
    if (!svg.title) diagnostics.push(diagnostic('error', 'HTML_SVG_TITLE', `svg[${index}]`, 'Add a non-empty title to each SVG.'))
    if (!svg.description) diagnostics.push(diagnostic('error', 'HTML_SVG_DESCRIPTION', `svg[${index}]`, 'Add a non-empty description to each SVG.'))
  })
  if (parsed.uncontainedCharts > 0) {
    diagnostics.push(diagnostic('error', 'HTML_CHART_REGION', file, 'Put each analytical SVG inside a section or figure with its exact-value table.'))
  }
  parsed.regions.forEach((region, index) => {
    if (region.charts > region.tables) {
      diagnostics.push(diagnostic('error', 'HTML_CHART_TABLE', `chart-region[${index}]`, 'Provide one exact-value table in the same section or figure as each chart.'))
    }
  })

  if (/\boutline\s*:\s*(?:none|0(?:\D|$))/i.test(html)) diagnostics.push(diagnostic('error', 'HTML_FOCUS_REMOVED', file, 'Do not remove focus outlines without a visible replacement.'))
  if (!/:focus-visible|:focus\b/i.test(html)) diagnostics.push(diagnostic('error', 'HTML_FOCUS_STYLE', file, 'Add a visible keyboard focus style.'))
  if (!/prefers-reduced-motion/i.test(html)) diagnostics.push(diagnostic('warning', 'HTML_REDUCED_MOTION', file, 'Declare reduced-motion behavior.'))
  if (!/forced-colors/i.test(html)) diagnostics.push(diagnostic('warning', 'HTML_FORCED_COLORS', file, 'Declare forced-colors behavior.'))
  if (!/\b(?:source|provenance)\b/i.test(html)) diagnostics.push(diagnostic('error', 'HTML_PROVENANCE', file, 'Include source or provenance information.'))

  const root = dirname(file)
  const rootReal = await realpath(root)
  const visited = new Set<string>()
  const inspectReference = async ({ element, attribute, reference, runtime }: Reference, sourceFile: string): Promise<void> => {
    if (isEmbedded(reference) || (!runtime && isRemote(reference))) return
    if (delivery === 'single-file') {
      diagnostics.push(diagnostic('error', isRemote(reference) ? 'HTML_REMOTE_ASSET' : 'HTML_RELATIVE_ASSET', reference, 'Single-file delivery must embed every dependency and artifact.'))
      return
    }
    if (isRemote(reference)) {
      diagnostics.push(diagnostic('error', 'HTML_REMOTE_ASSET', reference, `Offline bundle ${element} cannot require a remote resource.`))
      return
    }
    let path: string
    try {
      path = decodeURIComponent(reference.split(/[?#]/, 1)[0])
    } catch {
      diagnostics.push(diagnostic('error', 'HTML_INVALID_REFERENCE', reference, 'Bundle references must use valid URI encoding.'))
      return
    }
    const target = resolve(dirname(sourceFile), path)
    if (isAbsolute(path) || !isInside(root, target)) {
      diagnostics.push(diagnostic('error', 'HTML_BUNDLE_ESCAPE', reference, 'Bundle references must stay inside the report directory.'))
      return
    }
    if (!path) return
    let info
    let actualTarget: string
    try {
      actualTarget = await realpath(target)
      info = await stat(actualTarget)
    } catch {
      diagnostics.push(diagnostic('error', 'HTML_MISSING_ARTIFACT', reference, 'The referenced bundle artifact does not exist.'))
      return
    }
    if (!isInside(rootReal, actualTarget)) {
      diagnostics.push(diagnostic('error', 'HTML_BUNDLE_ESCAPE', reference, 'Bundle references must resolve inside the report directory.'))
      return
    }
    const referencedExtension = extname(target).toLowerCase()
    const extension = referencedExtension
      || (element === 'script' && attribute !== 'request' ? '.js' : element === 'style' && attribute === 'import' ? '.css' : '')
    const visitKey = `${actualTarget}\0${dirname(target)}\0${extension}`
    if (visited.has(visitKey)) return
    if (visited.size >= maxBundleArtifacts) {
      diagnostics.push(diagnostic('error', 'HTML_BUNDLE_LIMIT', reference, `Bundle audit supports at most ${maxBundleArtifacts} linked artifacts.`))
      return
    }
    if (!info.isFile()) {
      diagnostics.push(diagnostic('error', 'HTML_INVALID_ARTIFACT', reference, 'The referenced bundle artifact must be a file.'))
      return
    }
    visited.add(visitKey)
    if (!['.cjs', '.css', '.htm', '.html', '.js', '.mjs'].includes(extension)) return
    if (info.size > maxArtifactBytes) {
      diagnostics.push(diagnostic('error', 'HTML_ARTIFACT_SIZE', reference, 'Linked HTML, CSS, and JavaScript artifacts must not exceed 5 MiB.'))
      return
    }
    let content: string
    try {
      content = await readFile(actualTarget, 'utf8')
    } catch (error) {
      diagnostics.push(diagnostic('error', 'HTML_ARTIFACT_READ', reference, error instanceof Error ? error.message : String(error)))
      return
    }
    let nested: Reference[]
    try {
      nested = extension === '.html' || extension === '.htm'
        ? [...(await parseHtml(content)).references, ...inlineReferences(content)]
        : extension === '.css' ? cssReferences(content) : javascriptReferences(content)
    } catch (error) {
      diagnostics.push(diagnostic('error', 'HTML_ARTIFACT_PARSE', reference, error instanceof Error ? error.message : String(error)))
      return
    }
    for (const child of nested) {
      await inspectReference(child, target)
    }
  }
  for (const reference of [...parsed.references, ...inlineReferences(html)]) {
    await inspectReference(reference, file)
  }
  return diagnostics
}
