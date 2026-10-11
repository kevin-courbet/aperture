# ADR 0012: Complete Chart Widget

## Status

Accepted

## Decision

Aperture owns the complete chart widget. The widget contains the chart area,
title, headline KPI, KPI descriptions and changes, period indicator, controls,
and supporting notes.

The full-screen button belongs at the top-right corner of the widget. It opens
the complete widget, including its title, KPI, period, and notes. This placement
also applies on narrow screens.

The host supplies domain values, calculations, formatted text, and controlled
state. Aperture supplies reusable presentation components and widget layout.

## Consequences

`ChartWidget.Root` owns the full-screen target. Widget controls use this target
without host references. `ChartWidget.Summary` separates KPI content from the
header and chart area.

`ChartWidget.Actions` holds corner actions. `ChartWidget.Controls` holds
full-width selectors and filters without displacing the corner actions.
