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

- `DataTableControl`.
- `FullscreenControl`.
- `TimeRangeControl`.
- `ToggleControl`.

The host owns selected ranges, toggles, filtering, data access, and business
aggregation. Aperture owns presentation, accessible interaction, focus, and
exact-value defaults.

Charts own their exact-value table. Set `exactValues="available"` for a ready
chart and `exactValues="unavailable"` for loading, empty, or error states.
`DataTableControl` is disabled when values are unavailable. A widget supports
exactly one chart-owned table. Do not add a separate table region for chart
values. A controlled `tableVisible` value requires `onTableVisibleChange`.

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

Use `timeAxis={{ kind: 'calendar', interval: { unit, step } }}` only when the
reader task requires a fixed calendar interval. Use
`timeAxis={{ kind: 'observations' }}` for sparse event charts where ticks must
align with observations. Do not write custom date tick formatters in the common
API.

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
