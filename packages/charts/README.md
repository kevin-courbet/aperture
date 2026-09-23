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
an advanced chart requirement. TanStack Charts is pre-alpha and pinned by
Aperture.

## Exact Values

One `ChartWidget.Root` contains one Aperture chart. Set `exactValues` to
`available` for ready chart data and `unavailable` when no table exists. A
controlled `tableVisible` value requires `onTableVisibleChange`.

### Use one toolbar

Standalone charts show a full-screen button above the plot. The exact-value
button is hidden by default. Set `dataTableControl="visible"` to put it next to
the full-screen button. The table is collapsed by default. Set
`defaultTableVisible` to start with the table open. These options are independent.

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
  <ChartToolbar targetRef={targetRef} dataTableControl="visible" />
  <ChartWidget.Plot><BarChart {...props} /></ChartWidget.Plot>
</ChartWidget.Root>
```

`ChartToolbar` renders the `ChartWidget.Controls` slot. Do not put it inside
another controls slot. Its `dataTableControl` default is `hidden`. For a custom
toolbar, put `DataTableControl` and `FullscreenControl` in one
`ChartWidget.Controls` slot. An explicit `DataTableControl` stays visible.
One widget contains one toolbar and one exact-value table.

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

Legends use compact solid or outline markers with text labels. Swatches have no
striped fill. Line legends retain their dash patterns; point legends retain
their point size and fill. Swatch shapes separate legend entries, but do not
claim to encode matching shapes in bar marks. Labels and exact-value tables
provide the non-color route to series and values.

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

## Candlesticks

`date` is the observation instant at the center of a candle. Set
`candleInterval` to the period represented by each candle. Aperture derives body
width from that calendar interval and rejects observations that are too close
for it. This supports sparse series and calendar month-end observations without
inferring candle width from the gap between records.
