# ADR 0001: Chart Experience Product

## Status

Amended by ADR 0005

## Decision

Aperture standardizes chart components, widget composition, controls,
accessibility, and theming across projects. API breadth and component count are
not product goals by themselves.

Aperture has two first-class product use cases:

1. React library integration for larger applications. The widget layer provides
   reusable UX patterns and must match the host design system.
2. Planned standalone HTML generation for coding agents and chatbots that create
   one-off reports and analysis output. This path must make a complete chart
   easy to generate.

Both use cases share chart semantics, quality rules, accessibility, controls,
and reader behavior.

The ready-to-use path must require only chart data, reader purpose, and
applicable chart context. It supplies the default widget UX and accessible
behavior. Composition remains the extension path for application integration.

## Release Condition

Standalone HTML generation must not be presented as available until Aperture
defines its artifact, asset, and local-state contract, then implements and
validates that contract.

## Boundary

Planned Aperture generation tools will create chart content for reports.
Aperture is not a general report builder, data platform, or dashboard builder.
