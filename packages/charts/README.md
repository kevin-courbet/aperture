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
    kind: 'calendar',
    interval: { unit: 'quarter', step: 1 },
  }}
/>
```

Fixed calendar intervals reject invalid steps and domains that exceed the
supported tick limit. Use the advanced entry point for arbitrary tick values
or formatting.

Clock steps must divide their containing unit. For example, seconds can use 1,
2, 5, 10, 15, 20, or 30. They cannot use 7.

Dense fixed intervals keep their calendar tick marks. Their labels use
self-contained dates and thin to prevent overlap.

## Responsive Server Output

Set `initialWidth` to the expected server container width when it differs from
the 640 px default. Set `width` only when the chart must have a fixed width.

Use SVG when server output must include a visible chart. Canvas charts keep
their accessible exact values in server HTML and paint the chart after browser
hydration.

## Candlesticks

`date` is the observation instant at the center of a candle. Set
`candleInterval` to the period represented by each candle. Aperture derives body
width from that calendar interval and rejects observations that are too close
for it. This supports sparse series and calendar month-end observations without
inferring candle width from the gap between records.
