# Standalone Reports

## Ownership

Standalone report generation belongs to `@kevin-courbet/reports`, not Aperture.
Use the `create-data-reports` skill and the Reports specification and CLI.

Do not hand-write report HTML, SVG, styles, controls, or hydration code. Do not
copy Aperture components into a report. If Reports does not support the required
block, report the unsupported case as a library feature request.

Reports composes Aperture through its public React API and produces the offline
artifact. Aperture continues to own chart semantics, exact values, and chart
controls.

## Command

```sh
reports build report.json --output report.html
```

Treat a non-zero status as a specification or build failure. Do not bypass it
with a manual fallback.
