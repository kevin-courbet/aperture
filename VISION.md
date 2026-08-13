# Aperture Vision

Aperture is a React chart component library built on TanStack Charts. It
standardizes chart composition, controls, accessibility, and theming across
projects.

## Purpose

- Reuse the same chart components and interaction patterns across projects.
- Include chart controls and exact-value access with the chart API.
- Encode chart-design rules in typed APIs and documented generation schemas.
- Build on TanStack Charts. The common API must not require knowledge of TanStack Charts.

## Current React API

Aperture currently implements:

- Typed chart components.
- Composable widget parts for titles, plots, controls, notes, and exact values.
- Ready-to-use controls for time ranges, full screen, data views, and other
  common chart tasks.
- A default Aperture theme.
- Semantic theme tokens and stable structural slots.
- React Aria controls and replaceable icons.
- Explicit locale and time-zone behavior.
- Accessible exact-value views.
- Guidance for chart selection, scales, labels, missing values, and accessibility.
- Default chart styles and behavior for common integration paths.

For React integration, the host application manages data access, business
rules, and controlled state.

The React package is prepared for public releases as
`@kevin-courbet/aperture`. Its API is unstable while Aperture is in the `0.x`
release series.

## Application Integration

Applications use Aperture as a React library. Composable widget parts provide
the chart experience, while semantic tokens, structural slots, and replaceable icons
let the result match the application design system.

## Planned Standalone HTML

Standalone HTML generation is a planned product surface. Coding agents and
chatbots will use it to create charts for one-off reports and analysis output.
This path must make a complete, accessible result easy to produce without a new
application or repeated chart-design decisions.

The standalone artifact, asset, and local-state contract is not decided. Do not
present standalone generation as available until Aperture implements and
validates that contract.

The planned path must use the same chart semantics, quality rules, and reader
interaction patterns as the React API.

## Developer Experience

- Provide useful defaults and require chart data, reader purpose, units,
  source, locale, time zone, and missing-value meaning when applicable.
- Make the simple path short without limiting composition for larger projects.
- Give coding agents documented schemas and tool interfaces.
- Keep advanced TanStack access separate from the common Aperture API.
- Produce deterministic errors when required chart context is missing or invalid.

## Reader Experience

- Make charts understandable, trustworthy, and usable with keyboard and pointer input.
- Keep units, sources, notes, controls, and exact values with the chart.
- Use the same interaction patterns across applications and generated HTML.
- Match the host design system without losing accessible defaults.

## Principles

- Select a chart for the question. Do not select a chart only because it is new or unusual.
- Show units, denominators, sources, and missing data.
- Do not show one result as a trend.
- Do not use color as the only signal.
- Use motion only to explain a state change. Respect reduced-motion settings.
- Keep the component API separate from TanStack types. Provide a separate API that exposes TanStack types.
- Match the application design system. Preserve focus, contrast, and spacing defaults.
- Include useful widget defaults instead of requiring repeated integration code.

## Scope

Aperture is a chart component and widget library. Planned generation tools will
create chart content for reports. Aperture is not a general report builder,
data platform, or dashboard builder.

The current catalog demonstrates the API and user experience. The package API
is not stable yet.
