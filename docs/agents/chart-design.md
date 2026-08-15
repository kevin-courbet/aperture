# Chart Design

## Start With The Question

Identify the decision that the chart must support. Confirm the field types,
row count, expected maximum row count, unit, denominator, source, locale, time
zone, and missing-value meaning.

Select the simplest chart that answers the question. Do not select a chart only
because it is new or unusual.

## Preserve Data Accuracy

- Show units and denominators.
- Show goals as labeled reference marks.
- Show missing data. Do not connect unknown values.
- Do not draw a trend for one result.
- Do not truncate a scale if truncation exaggerates or hides a difference.
- Do not use 3D effects.
- Do not add marks that do not encode data or a reference value.
- Use calendar-aware time ticks. Show larger date context when it changes
  instead of repeating it on every tick.
- Aperture calendar intervals use the Gregorian calendar with localized labels.
- Declare the represented interval for candlesticks. Do not infer candle width
  from gaps between observations.
- Set the expected `initialWidth` for deterministic responsive server output.
- Use SVG when server output must contain a visible chart. Canvas paints after
  browser hydration.

## Compose The Widget

Add only controls that help the user answer the stated question. A control
exists because its React component is present. Do not use one component with
many feature flags.

The application manages data access, business aggregation, and controlled state.
Aperture controls chart presentation, keyboard and pointer behavior, focus, and
accessible defaults.

## Match The Host

Use semantic CSS variables for color, type, radius, and density. Use public
layout regions for structure. Keep chart-rendering calculations private.

Use the default Aperture theme when the application does not supply a theme.
The common API must include default styles and behavior.

## Accessibility

- Meet WCAG 2.2 AA.
- Supply an accessible chart name and description.
- Provide exact values in a semantic table.
- Support keyboard use and visible focus.
- Do not use color as the only signal.
- Respect reduced motion and forced colors.

## Contexts

Use the same chart semantics, quality rules, and reader experience in React
applications and in Reports compositions. Keep report layout, narrative, and
build-tool selection in `@kevin-courbet/reports`.
