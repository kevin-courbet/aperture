# React With Aperture

## Availability

The public package is `@kevin-courbet/aperture`. Its API is unstable while it
is in the `0.x` release series, so verify the installed or workspace version
before using an API.

Package entry points:

- `@kevin-courbet/aperture`: common charts, provider, widget, controls, states,
  and types.
- `@kevin-courbet/aperture/styles.css`: default styles and semantic tokens.
- `@kevin-courbet/aperture/tanstack`: advanced TanStack Charts primitives.

Do not invent props. Use Storybook documentation tools when available.

## Composition

Compose the widget from explicit slots:

```tsx
<ChartWidget.Root exactValues="available">
  <ChartWidget.Header>...</ChartWidget.Header>
  <ChartWidget.Controls>...</ChartWidget.Controls>
  <ChartWidget.Plot>...</ChartWidget.Plot>
  <ChartWidget.Footer>...</ChartWidget.Footer>
</ChartWidget.Root>
```

Remove an unused slot. Do not add feature flags to one all-purpose widget.

Available controls include:

- `ChartToolbar`: full screen and an optional exact-value button in one controls slot.
- `DataTableControl`.
- `FullscreenControl`.
- `TimeRangeControl`.
- `ToggleControl`.
- `SelectControl`: a dropdown for one filter dimension.

Headline figures:

- `StatTile`: one number with its change from an earlier period. Use it for
  KPI rows instead of host markup. Set `goodDirection`.
- `Sparkline`: a trend without axes for a tile or table row. Do not use it as
  the only view of a trend that the reader must analyze.

Page-level filter components:

- `FilterBar`: one row of filters above the charts it scopes. Put
  `SelectControl` and `ActiveFilters` in it.
- `ActiveFilters`: removable chips for active filters and a clear-all control.
- `useCrossFilter`: one value per filter dimension. `selection(dimension)`
  returns the `selection` props for a chart that sets that dimension.

The header and the controls share the first widget row when both fit. Put the
title and note in `ChartWidget.Header` and the time range and full-screen
controls in the controls slot. Do not add a separate toolbar row.

The host owns selected ranges, toggles, filtering, data access, and business
aggregation. Aperture owns presentation, accessible interaction, focus, and
exact-value defaults.

Charts own their exact-value table. Set `exactValues="available"` for a ready
chart and `exactValues="unavailable"` for loading, empty, or error states.
`DataTableControl` is disabled when values are unavailable. A widget supports
exactly one chart-owned table. Do not add a separate table region for chart
values. A controlled `tableVisible` value requires `onTableVisibleChange`.

Standalone charts have one toolbar above the plot. The exact-value button is
hidden by default. Keep it hidden. Set `dataTableControl="visible"` or add
`DataTableControl` only when the user asks for a visible data control. The
table is independently collapsed by default; `defaultTableVisible` opens it.
Exact values remain accessible when visually collapsed.

In a widget, add `<ChartToolbar targetRef={targetRef} />` instead of a
`ChartWidget.Controls` slot, or compose the individual controls in that slot.
Pass the same ref to `ChartWidget.Root`. Widget table state takes precedence
over standalone chart props. Do not add both toolbar forms to the same widget.

## Highlights And Cross-Filtering

- Use `highlights` to explain evidence: a time range or event on a time chart,
  a category band on a bar or dumbbell chart, or a cell outline on a heatmap.
  Each highlight needs a label. Select highlights by a documented rule in the
  host, such as a logged release or the largest change.
- Use `selection` on `BarChart`, `DumbbellChart`, or `HeatmapChart` when a
  click on a mark must filter the other charts. Bind it to `useCrossFilter`.
- Filter each chart by every dimension except the one it selects. The chart
  then shows every category and dims the unselected ones.
- Use `SelectControl` in a `FilterBar` for dimension filters. Do not build
  filter rows from groups of `ToggleControl` buttons.
- Choose where filter state lives: `useCrossFilter({ defaultValues })` in one
  component, `createCrossFilter<Dimension>()` with its `Provider` and
  `useFilters()` when charts are in separate components, or `values` with
  `onChange` when the URL or a store owns the state.
- Use `update` to set several dimensions in one change, such as a matrix cell.

### Filter the data where it lives

| Data location | Pattern |
|---|---|
| All rows in the browser, few dimensions and values | Pre-aggregate once into totals keyed by every filter combination, including "All". Store numerators and denominators, not rates. |
| All rows in the browser, many dimensions or high cardinality | Filter on demand from memoized rows, or use a columnar engine such as DuckDB-Wasm. Do not build a combination table. |
| Rows on a server | Send filter values as query parameters. Keep the previous chart data while the next query loads. Show a loading or error state when no data exists. |

Do not rescan source rows in every chart on every filter change. Memoize each
chart's rows on the filter values it uses.

Legends use compact solid or outline markers and text, without striped fills.
Keep labels and exact-value access. Legend swatch shapes are not shape encodings
for bar marks. Line and point symbols continue to match their chart marks.

## Provider

Use `ChartProvider` to set locale, time zone, messages, and icons. Defaults are
`en-GB` and `UTC`. Supply the real application locale and time zone when dates or
localized values are present.

## Data States

Use the typed loading, empty, error, and ready states. Use the singleton state
boundary for one-result charts. Do not render a line from one observation.

## Time Axes

Time charts use automatic calendar ticks by default. Aperture selects the
interval from the chart width and domain, then shows the year, month, date, or
time-zone context only when it changes. Calendar intervals use the Gregorian
calendar with labels localized by the provider locale.

Use `timeAxis={{ position: 'elapsed', ticks: { kind: 'calendar', interval: { unit, step } } }}`
only when the reader task requires a fixed calendar interval. Use
`timeAxis={{ position: 'observations' }}` when observations need equal spacing.
Use `format` only when source date labels are part of the reader task.

Set `initialWidth` to the expected server container width when it differs from
640 px. Use SVG when server HTML must include the visible chart. Canvas keeps
semantic exact values in server HTML and paints after hydration.

Set `candleInterval` on `CandlestickChart` to the period represented by each
candle. Do not infer this period from gaps in the data.

## Common Versus Advanced API

Start with the common chart components. Use the advanced TanStack entry only
when a verified requirement cannot be represented by the common API. Keep the
same widget, provider, state, exact-value, and accessibility boundaries.

## Storybook CLI

When Aperture Storybook runs, use:

```sh
bun "$SKILL_DIR/scripts/chart" storybook instructions --json
bun "$SKILL_DIR/scripts/chart" storybook list --with-story-ids --json
bun "$SKILL_DIR/scripts/chart" storybook docs <component-id> --json
bun "$SKILL_DIR/scripts/chart" storybook preview <story-id> --json
bun "$SKILL_DIR/scripts/chart" storybook test [story-id ...] --json
```

Set `APERTURE_MCP_URL` when the endpoint is not
`http://localhost:6006/mcp`. Include returned preview URLs in the handoff.
