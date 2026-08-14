# ADR 0005: Reports Own Report Composition

## Status

Accepted

## Decision

`@kevin-courbet/reports` and its `create-data-reports` skill own standalone
report specifications, narrative structure, provenance, SSR, hydration, asset
bundling, and output formats.

Aperture remains a chart component library. It owns chart semantics, controls,
exact values, accessibility, and chart interaction patterns. Reports composes
those public React components. Aperture does not provide a standalone report
renderer, and its visualization skill does not instruct agents to hand-write a
report fallback.
