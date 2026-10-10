import { bandX, bandY, cell, rect, ruleX, text } from '@tanstack/charts'
import { controlledSignal } from '@tanstack/charts/interaction/signal'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { keyedSelection, type KeyedSelectionChange } from '@tanstack/charts/selection'
import type { SemanticLegendItem } from './exact-values.js'
import type {
  ApertureMessages,
  CategoryHighlight,
  CategorySelection,
  CellHighlight,
  CellKey,
  CellSelection,
  ContinuousColorScale,
  TimeHighlight,
} from './types.js'
import { finite, validDate } from './validation.js'

export const annotationPaint = 'var(--aperture-color-annotation)'
export const annotationFill = 'var(--aperture-color-annotation-fill)'
export const selectionFill = 'var(--aperture-color-selection-fill)'
export const contextPaint = 'var(--aperture-chart-context)'
export const strongFillText = 'var(--aperture-color-on-strong-fill)'

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Mixes a paint toward a base color. A share of 1 keeps the paint. A share of 0 returns the base. */
export function mixPaint(paint: string, share: number, base = 'var(--aperture-color-surface)'): string {
  const percent = Math.round(clampUnit(share) * 1000) / 10
  return `color-mix(in oklab, ${paint} ${percent}%, ${base})`
}

/** Unselected marks keep their hue at low strength. A selection band and the description also identify the selection. */
export function dimPaint(paint: string): string {
  return mixPaint(paint, 0.32, 'var(--aperture-color-background)')
}

export function validContinuousScale(scale: ContinuousColorScale, family: string): ContinuousColorScale {
  if (scale.kind === 'sequential') {
    const [low, high] = scale.domain
    finite(low, `${family} color domain values must be finite.`)
    finite(high, `${family} color domain values must be finite.`)
    if (low >= high) throw new RangeError(`${family} color domain minimum must be less than its maximum.`)
    return scale
  }
  if (scale.kind === 'diverging') {
    const [low, mid, high] = scale.domain
    finite(low, `${family} color domain values must be finite.`)
    finite(mid, `${family} color domain values must be finite.`)
    finite(high, `${family} color domain values must be finite.`)
    if (!(low < mid && mid < high)) {
      throw new RangeError(`${family} diverging color domain must increase through its midpoint.`)
    }
    return scale
  }
  throw new RangeError(`${family} color scale kind must be sequential or diverging.`)
}

const sequentialFloor = 0.1

export interface ContinuousPaint {
  readonly fill: string
  /** Share of the scale paint in the fill, from 0 to 1. */
  readonly strength: number
}

export function continuousPaint(scale: ContinuousColorScale, value: number): ContinuousPaint {
  if (scale.kind === 'sequential') {
    const [low, high] = scale.domain
    const strength = sequentialFloor + (1 - sequentialFloor) * clampUnit((value - low) / (high - low))
    return { fill: mixPaint('var(--aperture-chart-1)', strength), strength }
  }
  const [low, mid, high] = scale.domain
  if (value >= mid) {
    const strength = clampUnit((value - mid) / (high - mid))
    return { fill: mixPaint('var(--aperture-chart-diverging-high)', strength), strength }
  }
  const strength = clampUnit((mid - value) / (mid - low))
  return { fill: mixPaint('var(--aperture-chart-diverging-low)', strength), strength }
}

/** Text on a fill keeps contrast by switching to the strong-fill text token above this strength. */
export function textOnFill(strength: number): string {
  return strength > 0.6 ? strongFillText : 'var(--aperture-color-text)'
}

export function continuousLegend(
  scale: ContinuousColorScale,
  label: string,
  format: (value: number) => string,
): SemanticLegendItem {
  if (scale.kind === 'sequential') {
    const [low, high] = scale.domain
    return {
      label,
      symbol: {
        kind: 'ramp',
        stops: [mixPaint('var(--aperture-chart-1)', sequentialFloor), mixPaint('var(--aperture-chart-1)', 1)],
        ticks: [format(low), format(high)],
      },
    }
  }
  const [low, mid, high] = scale.domain
  return {
    label,
    symbol: {
      kind: 'ramp',
      stops: [
        mixPaint('var(--aperture-chart-diverging-low)', 1),
        mixPaint('var(--aperture-chart-diverging-low)', 0),
        mixPaint('var(--aperture-chart-diverging-high)', 1),
      ],
      ticks: [format(low), format(mid), format(high)],
    },
  }
}

interface PreparedRange {
  readonly id: string
  readonly start: Date
  readonly end: Date
  readonly label: string
}

interface PreparedEvent {
  readonly id: string
  readonly date: Date
  readonly label: string
}

export interface PreparedTimeHighlights {
  readonly ranges: readonly PreparedRange[]
  readonly events: readonly PreparedEvent[]
  readonly legend: readonly SemanticLegendItem[]
  readonly description: string | undefined
}

const emptyTimeHighlights: PreparedTimeHighlights = { ranges: [], events: [], legend: [], description: undefined }

/**
 * Validates highlights and clips them to the observed time extent. A highlight
 * outside the extent is not drawn, because the chart does not show that time.
 */
export function prepareTimeHighlights(
  highlights: readonly TimeHighlight[] | undefined,
  dates: readonly Date[],
  messages: ApertureMessages,
  formatDay: (value: Date) => string,
): PreparedTimeHighlights {
  if (highlights === undefined || highlights.length === 0 || dates.length === 0) return emptyTimeHighlights
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (const date of dates) {
    minimum = Math.min(minimum, date.getTime())
    maximum = Math.max(maximum, date.getTime())
  }
  const ranges: PreparedRange[] = []
  const events: PreparedEvent[] = []
  const legend: SemanticLegendItem[] = []
  const described: string[] = []
  for (const [index, highlight] of highlights.entries()) {
    if (typeof highlight.label !== 'string' || highlight.label.trim() === '') {
      throw new TypeError('Time highlights require a label.')
    }
    if (highlight.kind === 'range') {
      const start = validDate(highlight.start, messages.errors.invalidDate).getTime()
      const end = validDate(highlight.end, messages.errors.invalidDate).getTime()
      if (start >= end) throw new RangeError(`Time highlight "${highlight.label}" must start before it ends.`)
      const clippedStart = Math.max(start, minimum)
      const clippedEnd = Math.min(end, maximum)
      if (clippedStart >= clippedEnd) continue
      const detail = `${formatDay(highlight.start)} – ${formatDay(highlight.end)}`
      ranges.push({ id: `range-${index}`, start: new Date(clippedStart), end: new Date(clippedEnd), label: highlight.label })
      legend.push({ label: highlight.label, detail, symbol: { kind: 'band' } })
      described.push(`${highlight.label}, ${detail}`)
    } else if (highlight.kind === 'event') {
      const date = validDate(highlight.date, messages.errors.invalidDate).getTime()
      if (date < minimum || date > maximum) continue
      const detail = formatDay(highlight.date)
      events.push({ id: `event-${index}`, date: new Date(date), label: highlight.label })
      legend.push({ label: highlight.label, detail, symbol: { kind: 'event' } })
      described.push(`${highlight.label}, ${detail}`)
    } else {
      throw new RangeError('Time highlight kind must be range or event.')
    }
  }
  return {
    ranges,
    events,
    legend,
    description: described.length === 0 ? undefined : `${messages.annotations.highlights}: ${described.join('; ')}.`,
  }
}

export interface TimeHighlightLabel {
  readonly id: string
  readonly date: Date
  readonly text: string
  readonly row: number
  readonly anchor: 'start' | 'end'
}

// Estimates from the 11px label font and typical axis margins. Labels use rows
// in the plot headroom so their positions follow the data scale on resize.
const labelCharacterWidth = 6.2
const labelPadding = 10
const plotMarginEstimate = 64
const maximumLabelRows = 5

/**
 * Places each label in the first headroom row where it does not overlap. A
 * label that fits in no row is not drawn in the plot. The legend and the
 * accessible description still name it.
 */
export function layoutTimeHighlightLabels(
  prepared: PreparedTimeHighlights,
  domain: readonly [Date, Date],
  width: number,
): { readonly labels: readonly TimeHighlightLabel[]; readonly rows: number } {
  const anchors = [
    ...prepared.ranges.map((range) => ({ id: range.id, date: range.start, text: range.label })),
    ...prepared.events.map((event) => ({ id: event.id, date: event.date, text: event.label })),
  ].sort((left, right) => left.date.getTime() - right.date.getTime())
  if (anchors.length === 0) return { labels: [], rows: 0 }
  const plotWidth = Math.max(120, width - plotMarginEstimate)
  const start = domain[0].getTime()
  const span = Math.max(1, domain[1].getTime() - start)
  const rowEnds: number[] = []
  const labels: TimeHighlightLabel[] = []
  for (const anchor of anchors) {
    const x = ((anchor.date.getTime() - start) / span) * plotWidth
    const labelWidth = anchor.text.length * labelCharacterWidth + labelPadding
    const anchorSide: 'start' | 'end' = x + labelWidth > plotWidth ? 'end' : 'start'
    const left = anchorSide === 'start' ? x : x - labelWidth
    const right = anchorSide === 'start' ? x + labelWidth : x
    let row = rowEnds.findIndex((end) => end <= left)
    if (row === -1 && rowEnds.length < maximumLabelRows) row = rowEnds.length
    if (row === -1) continue
    rowEnds[row] = right
    labels.push({ ...anchor, row, anchor: anchorSide })
  }
  return { labels, rows: rowEnds.length }
}

/** A nice linear domain with headroom for annotation label rows above the data. */
export function annotatedDomain(values: readonly number[], labelRows: number, includeZero: boolean): readonly [number, number] {
  if (values.length === 0) throw new RangeError('Annotated charts require at least one value.')
  let low = Math.min(...values)
  let high = Math.max(...values)
  if (includeZero) {
    low = Math.min(0, low)
    high = Math.max(0, high)
  }
  if (low === high) {
    low -= 1
    high += 1
  }
  const top = high + (high - low) * 0.15 * labelRows
  const [niceLow, niceHigh] = scaleLinear().domain([low, top]).nice().domain()
  return [niceLow, niceHigh]
}

export function timeHighlightBackground(prepared: PreparedTimeHighlights, yDomain: readonly [number, number]) {
  return [
    ...(prepared.ranges.length === 0 ? [] : [decorative(rect(prepared.ranges, {
      id: 'aperture-highlight-ranges',
      x1: 'start', x2: 'end', y1: () => yDomain[0], y2: () => yDomain[1],
      key: 'id', fill: annotationFill,
    }))]),
    ...(prepared.events.length === 0 ? [] : [decorative(ruleX(prepared.events, {
      id: 'aperture-highlight-events',
      x: 'date', stroke: annotationPaint, strokeWidth: 1.25, strokeDasharray: '3 3',
    }))]),
  ]
}

export function timeHighlightLabelMarks(labels: readonly TimeHighlightLabel[], yTop: number) {
  return labels.length === 0 ? [] : [decorative(text(labels, {
    id: 'aperture-highlight-labels',
    x: 'date', y: () => yTop, text: 'text', key: 'id',
    anchor: (label) => label.anchor,
    dx: (label) => label.anchor === 'start' ? 4 : -4,
    dy: (label) => 12 + label.row * 14,
    fill: annotationPaint, fontSize: 11, fontWeight: 500,
  }))]
}

export interface PreparedCategoryHighlights {
  readonly rows: readonly CategoryHighlight[]
  readonly legend: readonly SemanticLegendItem[]
  readonly description: string | undefined
}

export function prepareCategoryHighlights(
  highlights: readonly CategoryHighlight[] | undefined,
  categories: readonly string[],
  messages: ApertureMessages,
): PreparedCategoryHighlights {
  if (highlights === undefined || highlights.length === 0) return { rows: [], legend: [], description: undefined }
  const known = new Set(categories)
  const byLabel = new Map<string, string[]>()
  for (const highlight of highlights) {
    if (typeof highlight.label !== 'string' || highlight.label.trim() === '') {
      throw new TypeError('Category highlights require a label.')
    }
    if (!known.has(highlight.category)) {
      throw new RangeError(`Highlighted category is not in the chart data: ${highlight.category}`)
    }
    byLabel.set(highlight.label, [...(byLabel.get(highlight.label) ?? []), highlight.category])
  }
  const legend = [...byLabel.entries()].map(([label, members]): SemanticLegendItem => ({ label, detail: members.join(', '), symbol: { kind: 'band' } }))
  return {
    rows: highlights,
    legend,
    description: `${messages.annotations.highlights}: ${legend.map((item) => `${item.label}, ${item.detail}`).join('; ')}.`,
  }
}

/** Bands behind vertical categories: the selection band, then highlight bands. */
export function categoryBandMarksX(highlights: readonly CategoryHighlight[], selected: string | null) {
  return [
    ...(selected === null ? [] : [decorative(bandX([{ category: selected }], { id: 'aperture-selection-band', x: 'category', fill: selectionFill }))]),
    ...(highlights.length === 0 ? [] : [decorative(bandX(highlights, { id: 'aperture-highlight-bands', x: 'category', fill: annotationFill }))]),
  ]
}

/** Bands behind horizontal categories: the selection band, then highlight bands. */
export function categoryBandMarksY(highlights: readonly CategoryHighlight[], selected: string | null) {
  return [
    ...(selected === null ? [] : [decorative(bandY([{ category: selected }], { id: 'aperture-selection-band', y: 'category', fill: selectionFill }))]),
    ...(highlights.length === 0 ? [] : [decorative(bandY(highlights, { id: 'aperture-highlight-bands', y: 'category', fill: annotationFill }))]),
  ]
}

export interface PreparedCellHighlights {
  readonly rows: readonly CellHighlight[]
  readonly legend: readonly SemanticLegendItem[]
  readonly description: string | undefined
}

export function prepareCellHighlights(
  highlights: readonly CellHighlight[] | undefined,
  cells: readonly CellKey[],
  messages: ApertureMessages,
): PreparedCellHighlights {
  if (highlights === undefined || highlights.length === 0) return { rows: [], legend: [], description: undefined }
  const known = new Set(cells.map((key) => cellKey(key)))
  const byLabel = new Map<string, string[]>()
  for (const highlight of highlights) {
    if (typeof highlight.label !== 'string' || highlight.label.trim() === '') {
      throw new TypeError('Cell highlights require a label.')
    }
    if (!known.has(cellKey(highlight))) {
      throw new RangeError(`Highlighted cell is not in the chart data: ${highlight.x}, ${highlight.y}`)
    }
    byLabel.set(highlight.label, [...(byLabel.get(highlight.label) ?? []), `${highlight.y} · ${highlight.x}`])
  }
  const legend = [...byLabel.entries()].map(([label, members]): SemanticLegendItem => ({ label, detail: members.join(', '), symbol: { kind: 'outline' } }))
  return {
    rows: highlights,
    legend,
    description: `${messages.annotations.highlights}: ${legend.map((item) => `${item.label}, ${item.detail}`).join('; ')}.`,
  }
}

export function cellOutlineMarks(highlights: readonly CellHighlight[], selected: CellKey | null) {
  return [
    ...(selected === null ? [] : [decorative(cell([selected], {
      id: 'aperture-selection-cell', x: 'x', y: 'y', fill: 'none', stroke: 'var(--aperture-color-text)', strokeWidth: 2, inset: 2,
    }))]),
    ...(highlights.length === 0 ? [] : [decorative(cell(highlights, {
      id: 'aperture-highlight-cells', x: 'x', y: 'y', fill: 'none', stroke: annotationPaint, strokeWidth: 2.5, inset: 4,
    }))]),
  ]
}

export function cellKey(key: CellKey): string {
  return `${key.x}\u001f${key.y}`
}

function validateSelectionHandler(onChange: unknown, family: string) {
  if (typeof onChange !== 'function') throw new TypeError(`${family} selection requires an onChange function.`)
}

/**
 * Binds a controlled category selection to chart activation. A click, Enter,
 * or Space selects the focused mark. Activating the selected mark, or a click
 * on an empty plot area, clears the selection.
 */
export function categorySelectionController<TDatum>(
  selection: CategorySelection,
  key: (datum: TDatum) => string | null | undefined,
  categories: readonly string[],
) {
  validateSelectionHandler(selection.onChange, 'Category')
  if (selection.value !== null && !categories.includes(selection.value)) {
    throw new RangeError(`Selected category is not in the chart data: ${selection.value}`)
  }
  return keyedSelection<TDatum, string>({
    selected: controlledSignal<string | null, KeyedSelectionChange<TDatum, string>>(
      selection.value,
      (next, { reason }) => {
        if (reason.type === 'select' && next === selection.value) selection.onChange(null)
        else selection.onChange(next)
      },
    ),
    key,
  })
}

export function cellSelectionController<TDatum extends CellKey>(selection: CellSelection, cells: readonly CellKey[]) {
  validateSelectionHandler(selection.onChange, 'Cell')
  const byKey = new Map(cells.map((value) => [cellKey(value), { x: value.x, y: value.y }] as const))
  const current = selection.value === null ? null : cellKey(selection.value)
  if (current !== null && !byKey.has(current)) {
    throw new RangeError(`Selected cell is not in the chart data: ${selection.value?.x}, ${selection.value?.y}`)
  }
  return keyedSelection<TDatum, string>({
    selected: controlledSignal<string | null, KeyedSelectionChange<TDatum, string>>(
      current,
      (next, { reason }) => {
        if (next === null || (reason.type === 'select' && next === current)) selection.onChange(null)
        else selection.onChange(byKey.get(next) ?? null)
      },
    ),
    key: (datum) => cellKey(datum),
  })
}

export function selectionDescription(messages: ApertureMessages, selected: string | null): string {
  return selected === null
    ? messages.selection.instructions
    : `${messages.selection.instructions} ${messages.selection.selected}: ${selected}.`
}
