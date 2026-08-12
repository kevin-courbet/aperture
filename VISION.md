# Aperture Vision

Aperture adds accurate and accessible charts to React projects.

## Purpose

- Give developers and coding agents one typed chart API.
- Give readers accurate charts and exact-value access.
- Use consistent behavior in React applications and standalone pages.
- Build on TanStack Charts. The common API must not require knowledge of TanStack Charts.

## Product

Aperture will provide:

- Typed chart components.
- Composable widget parts and controls.
- A default Aperture theme.
- Semantic theme tokens and stable structural slots.
- React Aria controls and replaceable icons.
- Explicit locale and time-zone behavior.
- Accessible exact-value views.
- Guidance for chart selection, scales, labels, missing values, and accessibility.

The host application manages data access, business rules, and controlled state.

## Principles

- Select a chart for the question. Do not select a chart only because it is new or unusual.
- Show units, denominators, sources, and missing data.
- Do not show one result as a trend.
- Do not use color as the only signal.
- Use motion only to explain a state change. Respect reduced-motion settings.
- Keep the component API separate from TanStack types. Provide a separate API that exposes TanStack types.
- Match the application design system. Preserve focus, contrast, and spacing defaults.

## Scope

Aperture is a chart design system. It is not a report builder, data platform,
or dashboard builder.

The current catalog demonstrates the API and user experience. The package API
is not stable yet.
