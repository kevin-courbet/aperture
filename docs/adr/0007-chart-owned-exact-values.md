# ADR 0007: Chart-Owned Exact Values

## Status

Accepted

## Decision

Each Aperture chart owns its semantic exact-value table. A standalone chart
provides its own disclosure control. A `ChartWidget.Root` contains one chart and
declares whether exact values are `available` or `unavailable`; its
`DataTableControl` controls that chart-owned table.

Aperture does not expose a manual chart table region or an exact-value
replacement API. A host can add a separate table only when it serves a separate
reader task.
