# ADR 0006: Calendar-Aware Time Axes

## Status

Accepted

## Decision

Aperture time axes use an opinionated automatic calendar policy by default.
Tick selection responds to the visible domain, chart width, locale, and IANA
time zone. Labels show larger calendar context when it changes instead of
repeating the year or date on every tick.

Calendar intervals use the Gregorian calendar. Locale controls label language
and ordering, not the calendar system.

Dense caller-selected intervals keep their calendar tick marks. Labels become
self-contained and thin when all context cannot fit.

The common API supports automatic calendar ticks, a caller-selected calendar
interval, and observation-aligned ticks. Arbitrary formatters and renderer
types remain in the advanced API.

Time-axis presentation must work consistently in SVG, Canvas, and narrow
layouts. Responsive server output uses an explicit initial width. Server output
uses SVG when the visible plot is required because Canvas paints after browser
hydration. Aperture does not expose multi-row labels or year-divider treatments
until those treatments meet the same interaction, measurement, and responsive
behavior in every supported renderer.
