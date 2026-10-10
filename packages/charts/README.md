# Aperture

Aperture is a React chart component library built on TanStack Charts. It
includes typed charts, widget slots, controls, exact-value tables, semantic CSS
tokens, and replaceable icons.

The API is unstable while Aperture is in the `0.x` release series.

## Install

```sh
pnpm add @kevin-courbet/aperture react react-dom
```

Import components from `@kevin-courbet/aperture`. Browser-aware bundlers load
the Aperture styles through the package browser export.

```tsx
import { ChartProvider, LineChart } from '@kevin-courbet/aperture'
```

Import `@kevin-courbet/aperture/styles.css` when the build does not use package
browser exports.

Use `@kevin-courbet/aperture/tanstack` only when the common API does not meet
an advanced chart requirement. Aperture pins TanStack Charts to `1.1.0`.

## Exact Values

One `ChartWidget.Root` contains one Aperture chart. Set `exactValues` to
`available` for ready chart data and `unavailable` when no table exists. A
controlled `tableVisible` value requires `onTableVisibleChange`.

### Use one toolbar

Standalone charts show a full-screen button above the plot. The exact-value
button is hidden by default. Show it only when the product requires a visible
data control. Set `dataTableControl="visible"` to put it next to the full-screen
button. The table is collapsed by default. Set `defaultTableVisible` to start
with the table open. These options are independent.

```tsx
<BarChart {...props} dataTableControl="visible" defaultTableVisible={false} />
```

Collapsed tables remain in the accessibility tree. The hidden button is not in
the tab order. Set `dataTableControl="visible"` when sighted readers need to open
the table. Loading, empty, and error states do not create a table or toolbar.

Inside a widget, the host owns the toolbar and table state. Chart-level
`dataTableControl` and `defaultTableVisible` do not override the widget.

```tsx
const targetRef = useRef<HTMLElement>(null)

<ChartWidget.Root ref={targetRef} exactValues="available">
  <ChartWidget.Header>Monthly sales</ChartWidget.Header>
  <ChartToolbar targetRef={targetRef} />
  <ChartWidget.Plot><BarChart {...props} /></ChartWidget.Plot>
</ChartWidget.Root>
```

`ChartToolbar` renders the `ChartWidget.Controls` slot. Do not put it inside
another controls slot. Its `dataTableControl` default is `hidden`. For a custom
toolbar, put `DataTableControl` and `FullscreenControl` in one
`ChartWidget.Controls` slot. An explicit `DataTableControl` stays visible.
One widget contains one toolbar and one exact-value table.

### Place the toolbar

The header and the controls share the first row of a widget when both fit.
The controls align to the end of the row. In a narrow widget the controls wrap
below the header. Put the title and its note in `ChartWidget.Header`, and the
time range and full-screen controls in one controls slot.

### Full-screen sizing

Use `ChartWidget.Root` as the full-screen target. Keep the title, controls, plot,
and footer in its slots. In full screen, the plot fills the remaining height
after these elements and the legend. It responds to window and content changes.
On exit, the chart returns to its configured `height` and `width`.

Standalone charts use the same layout. A wrapper target is supported when the
widget is its direct child and the wrapper supplies a definite content height.
For a custom layout, use the widget itself as the target. Small screens scroll
when the controls and the minimum plot height do not fit. The native full-screen
API handles entry and Escape; exit returns focus to the full-screen button.

### Read legends

Each legend symbol matches its mark. Bars, areas, and cells use one square
swatch shape. Lines keep their dash pattern. Points keep their size and fill.
A chart with one series shows no series entry, because the title names it.
References, missing values, highlights, and color scales have their own symbols.
Labels and exact-value tables provide the non-color route to series and values.

## Chart Chrome

Axis titles use the muted text token at weight 500. Tick labels, grid lines,
and axis lines stay below the data in contrast. Data marks, direct value labels,
and references use full strength. Keep host titles and notes in the same order:
a strong title, then a muted note.

## Highlights

Highlights draw a labeled region behind the data. Each highlight appears in
the legend and in the accessible description.

- `LineChart`, `AreaChart`, and `StackedAreaChart` accept time highlights.
  A `range` highlight shades an interval. An `event` highlight draws a dashed
  rule. Labels sit in headroom above the data. A highlight outside the plotted
  dates is not drawn. Time highlights require an elapsed time axis.
- `BarChart` and `DumbbellChart` accept category highlights. Each draws a band
  behind its category.
- `HeatmapChart` accepts cell highlights. Each draws an outline.

```tsx
<LineChart
  {...props}
  highlights={[
    { kind: 'range', start: new Date('2026-09-08T00:00:00Z'), end: new Date('2026-09-21T00:00:00Z'), label: 'Incident window' },
    { kind: 'event', date: new Date('2026-09-08T00:00:00Z'), label: 'web-checkout 4.12.0' },
  ]}
/>
<BarChart {...barProps} highlights={[{ category: '4.12.0', label: 'Released on EU mobile web' }]} />
<HeatmapChart {...matrixProps} highlights={[{ x: 'Mobile web', y: 'EU', label: 'Largest drop' }]} />
```

A highlight that names an unknown category or cell throws a `RangeError`.

## Cross-Filtering

A chart selection can filter every other chart on the page. Aperture owns the
selection interaction. The host owns the filter state, filtering, and
aggregation.

- `BarChart` and `DumbbellChart` accept `selection: { value, onChange }` for
  one category. `HeatmapChart` accepts a selection of one cell.
- A click, Enter, or Space selects the focused mark. Activating the selected
  mark, or a click on an empty plot area, clears the selection.
- While a selection exists, the other marks are dimmed, a band marks the
  selected category, and the description names the selection.
- `useCrossFilter` holds one value per dimension. `selection(dimension)`
  returns the props for a chart that filters that dimension. `update` sets
  several dimensions in one change.
- `FilterBar` scopes page-level controls. `SelectControl` is a dropdown for one
  dimension. `ActiveFilters` shows removable chips and a clear-all control.

### Choose where the filter state lives

- One component holds every chart: call `useCrossFilter({ defaultValues })`.
- Charts are in separate components: create a typed group once with
  `createCrossFilter<Dimension>()`. Wrap the page in its `Provider` and call its
  `useFilters()` in each component. Each group is independent.
- The URL or an application store owns the state: pass `values` and
  `onChange` to `useCrossFilter` or to the `Provider`. Aperture reports each
  change with the complete next values.

```tsx
type Dimension = 'region' | 'device'
const pageFilters = createCrossFilter<Dimension>('PageFilters')

function RegionChart() {
  const filters = pageFilters.useFilters()
  const rows = useRegionTotals({ ...filters.values, region: null })
  return <BarChart {...props} state={chartData(rows)} selection={filters.selection('region')} />
}

<pageFilters.Provider values={valuesFromUrl} onChange={writeValuesToUrl}>
  <PageFilterBar />
  <RegionChart />
</pageFilters.Provider>
```

A chart usually ignores its own dimension when the host filters its rows. The
reader can then see every category and change the selection in place.
Aperture does not filter or aggregate data. The application chooses the
method that fits where its data lives.

## Color Scales

`HeatmapChart` and `ChoroplethChart` take a `colorScale`:

- `{ kind: 'sequential', domain: [min, max] }` mixes `--aperture-chart-1` into
  the surface color.
- `{ kind: 'diverging', domain: [min, mid, max] }` uses
  `--aperture-chart-diverging-low` below the midpoint and
  `--aperture-chart-diverging-high` above it. The midpoint is the surface color.

The legend shows the scale as a gradient with its domain values. Set
`valueLabels` on `HeatmapChart` to print each value in its cell. Text on strong
fills uses `--aperture-color-on-strong-fill`.

## Dumbbell Charts

`DumbbellChart` compares two states per category on one scale, such as a
baseline period and an incident period. The start point uses
`--aperture-chart-context`. The end point uses `--aperture-chart-1`. Each row
shows the signed change at the right edge. Set the same `domain` on charts that
the reader compares side by side.

```tsx
<DumbbellChart
  state={chartData(rows)}
  startLabel="17 Aug – 7 Sep"
  endLabel="8–21 Sep"
  domain={[45, 75]}
  formatChange={(change) => `${change > 0 ? '+' : ''}${change.toFixed(1)} pp`}
  {...accessibleProps}
/>
```

## Headline Figures

`StatTile` shows one number, its change from an earlier period, an optional
trend, and a note. Set `goodDirection` so the change uses the positive or danger
color. The arrow, the sign, and screen-reader text carry the direction, so color
is not the only signal. Loading, empty, and error states use the typed
singleton state.

`Sparkline` is a line chart without axes, legend, or controls. Put it in a
`StatTile` `trend` slot or next to a number it explains. Points from
`accentFrom` onward use the accent color; earlier points use the context color.
Range and event highlights are drawn without labels. The description states the
first, last, lowest, and highest values, and a hidden table holds every value.

```tsx
<StatTile
  label="Checkout conversion · 8–21 Sep"
  state={{ status: 'ready', datum: { value: 61.6, comparison: { value: 64.8, label: 'vs 17 Aug – 7 Sep' } } }}
  format={(value) => value.toFixed(1)}
  unit="%"
  goodDirection="increase"
  formatDelta={(delta) => `${delta.toFixed(1)} pp`}
  trend={<Sparkline state={chartData(dailyConversion)} ariaLabel="Daily checkout conversion" accentFrom={incidentStart} />}
/>
```

## Time Axes

Time charts select calendar ticks from the chart width, date domain, locale,
and time zone. Labels show the year or date when calendar context changes.
Calendar intervals use the Gregorian calendar and localize its labels with the
provider locale.

Use the automatic policy unless the reader task requires a fixed interval or
ticks at observations:

```tsx
<LineChart
  {...props}
  timeAxis={{
    position: 'elapsed',
    ticks: { kind: 'calendar', interval: { unit: 'quarter', step: 1 } },
  }}
/>
```

Fixed calendar intervals reject invalid steps and domains that exceed the
supported tick limit. Use `position: 'observations'` for equal spacing between
source observations. The optional `format` function replaces time-axis labels.

Clock steps must divide their containing unit. For example, seconds can use 1,
2, 5, 10, 15, 20, or 30. They cannot use 7.

Dense fixed intervals keep their calendar tick marks. Their labels use
self-contained dates and thin to prevent overlap.

## Presentation Options

Set `LineChart.appearance` to control area fill, curve type, and point visibility.
Use `appearance.series` when one series needs different options.

Use `AreaChart.appearance` or `StackedAreaChart.appearance` for a solid fill or
a vertical gradient. An optional outline uses the color of each series.

Set `DateBrush.appearance` to `low-emphasis` to hide the selection at rest. The
selection appears during pointer or keyboard interaction.

Set `DateBrush.interaction="select"` for drag-to-select zoom. Pointer hover shows
only a crosshair cursor. Each drag starts a new horizontal selection, including
inside the current range. The selection appears during the drag and disappears
on release or cancellation. A click without a range does not commit a selection.
Keyboard range controls retain visible focus. The host applies the committed range.

Set `DonutChart.labelPlacement` to `inline` to show each label, value, and
percentage around the donut. This option also shows the total in the center.

Set `BarChart.appearance.cornerRadius` to a nonnegative pixel radius for rounded
bars. The radius applies to all corners, including each grouped or stacked bar.

Horizontal single-series bars accept `valueLabelPlacement="outside-end"`.
`SankeyChart.appearance` controls node width, node spacing, link color, link
curves, and node-label details.

## Tooltips

Charts show the default localized tooltip unless `tooltip` is `false`. A tooltip
options object can supply `renderBody` for custom React content.

Grouped charts also accept `groupedTotal`. This function returns a label and a
formatted total for the focused group.

## Rendering

Set `rendering.kind` to `svg`, `canvas`, or `motion`. The `motion` variant uses
SVG transitions and respects reduced-motion preferences by default.

Motion options control initial animation, resize animation, and tween or spring
transitions. Aperture always respects reduced-motion preferences.

## Responsive Server Output

Set `initialWidth` to the expected server container width when it differs from
the 640 px default. Set `width` only when the chart must have a fixed width.

Use SVG or motion when server output must include a visible chart. Canvas charts keep
their accessible exact values in server HTML and paint the chart after browser
hydration.

## Advanced Charts

Import `AdvancedChart` from `@kevin-courbet/aperture/tanstack` when the common
API cannot express the required chart. This entry exposes pinned TanStack types.

`AdvancedChart` supports all three rendering variants, dimension validation,
theme-root styling, and custom React tooltip bodies.

TanStack chart definitions use `scales.x` and `scales.y`. Set an unused scale
to `null`. Polar marks use `scales.angle` and `scales.radius`.

## Candlesticks

`date` is the observation instant at the center of a candle. Set
`candleInterval` to the period represented by each candle. Aperture derives body
width from that calendar interval and rejects observations that are too close
for it. This supports sparse series and calendar month-end observations without
inferring candle width from the gap between records.
