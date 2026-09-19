# ADR 0009: Host Chart Presentation

## Status

Accepted

## Decision

Aperture charts accept chart-specific formatters for dates, axis numbers, and
exact numbers. These formatters apply to axes, tooltips, legends, and exact-value
tables. The default formatters continue to use the locale and time zone from
`ChartProvider`.

Aperture provides eight semantic chart-color tokens. A host can replace these
tokens for one chart through `CommonChartProps.style`.

Time charts support elapsed-time positions and equal observation positions.
Observation positions preserve source order and equal distance between adjacent
observations.

Charts expose typed presentation choices only when the choice preserves chart
semantics. Stacked-area charts support linear or monotone interpolation, an
optional crosshair, and a separate controlled brush component.

The brush value uses dates. The host application owns the selected date range.
Aperture owns pointer, keyboard, focus, and accessible brush behavior.

## Consequences

This decision replaces the ADR 0006 restriction against common-API formatters.
The common API does not expose TanStack formatter, scale, curve, or brush types.
