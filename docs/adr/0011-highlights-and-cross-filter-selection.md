# Highlights And Cross-Filter Selection

## Status

Proposed on 2026-10-10.

## Decision

Charts accept labeled highlights: time ranges and events on time charts,
category bands on bar and dumbbell charts, and cell outlines on heatmaps.
Highlights appear in the legend and in the accessible description.

`BarChart`, `DumbbellChart`, and `HeatmapChart` accept a controlled single
selection. Pointer, Enter, and Space activation select a mark through TanStack
keyed selection. Activating the selected mark clears it.

Aperture provides `useCrossFilter`, `createCrossFilter`, `FilterBar`,
`SelectControl`, and `ActiveFilters` for page-level filter state and controls.
Filter state is uncontrolled, controlled by the application through `values`
and `onChange`, or shared through a typed provider for charts in separate
components.

## Consequences

Aperture owns selection interaction, selection emphasis, and filter controls.
The host owns filtering and aggregation, as `VISION.md` requires. Each chart
ignores its own dimension in the host filter, so the reader can change a
selection in place.

Aperture does not provide an aggregation index. The right method depends on
where the data lives: a combination table for small client data, on-demand
filtering or a columnar engine for large client data, and query parameters for
server data. The skill documents each pattern. A shared index helper would
change the library boundary and needs a separate decision.
