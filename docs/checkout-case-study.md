# Checkout case study: Dashboard artifact against Aperture

Date: 2026-10-10. Branch: `checkout-case-study`.

## Purpose

Build the same root-cause dashboard twice on one synthetic dataset. The first
build uses the Claude Dashboard artifact type with its `dash` runtime and d3.
The second build uses Aperture through the `create-data-visualizations` skill.
The comparison shows where Aperture stops a coding agent from producing the
same analysis, so each gap can become library work.

## Deliverables

- Dashboard artifact: https://claude.ai/artifact/2uyQDznBmJQk8mXmjKdYy8
- Aperture page: catalog `Demo/Checkout case study`, stories `Root cause` and
  `Eu mobile web card`.
  - `apps/catalog/stories/CaseStudy.stories.tsx`
  - `apps/catalog/stories/components/CheckoutCasePage.tsx`
  - `apps/catalog/stories/components/checkout-analysis.ts` (host aggregation)
  - `apps/catalog/src/fixtures/checkout.ts` (1,512 generated rows)
  - `apps/catalog/src/case-study.css`
- Session scratch files, not in the repository: the data generator
  (`gen/gen-checkout.ts`, seed `0x5eed2026`), `data/checkout.csv`,
  `data/events.json`, eight chart specifications in `specs/` (all pass
  `validate-spec`), and screenshots in `shots/`.

## The case

Northwind Outfitters (fictional) sells outdoor gear online. The data is one row
per UTC day, region (NA, EU, APAC, LATAM), device (Desktop, Mobile web, App)
and payment method (Card, Wallet, Bank transfer) from 17 August to 27 September
2026: checkouts started, shipping completed, payments submitted, failures by
reason (3-D Secure timeout, issuer declined, gateway error), confirmed orders,
and the checkout build that served the segment.

The story the reader must find by slicing:

| Slice | Before (17 Aug–7 Sep) | Incident (8–21 Sep) |
|---|---|---|
| All checkouts, conversion | 64.8% | 61.6% |
| EU, conversion | 64.2% | 56.2% |
| Mobile web, conversion | 60.1% | 53.1% |
| Card, conversion | 63.7% | 58.5% |
| EU · Mobile web · Card, conversion | 58.8% | 34.7% |
| 3-D Secure timeouts, build 4.11.3 / 4.12.0 / 4.12.1 | 1.8% | 43.6% / 13.3% |

Root cause: web-checkout 4.12.0 (8 Sep, EU mobile web only) enforced the 3-D
Secure challenge with a 10-second window. The 4.12.1 hotfix (22 Sep) is
partial. Two red herrings exist: a 40-minute gateway degradation on 26 August
and a three-day APAC promotion from 1 September.

## Process comparison

| Step | Dashboard artifact type | Aperture skill |
|---|---|---|
| Data contract | Two attached files and three `dash.calc` functions; every figure is a marked cell with a visible formula | One chart specification per chart (population, numerator, denominator, exclusions, missing value), validated by the CLI |
| Filters | `dash/params` with three selects, a reset, and click-to-filter on rows, cells and bars | Host React state with groups of `ToggleControl` buttons; no click-to-filter |
| Charts | Hand-drawn d3: event-annotated line, dumbbells, diverging heatmap with values, small multiples on one scale, emphasis bars, funnel with loss labels, sortable table, sparklines | `LineChart`, grouped and single `BarChart`, `HeatmapChart`, `StackedAreaChart`; stat tiles and the event list are host markup |
| Verification allowed | One syntax check; the type forbids rendering | Typecheck, spec validation, Storybook a11y tests, screenshots |
| Code written | 776 lines of HTML, CSS and JavaScript | 430 lines of TypeScript plus 140 lines of aggregation and 70 lines of CSS |

## Aperture changes after review

The review on 2026-10-10 asked for ten changes. Status:

| Request | Result |
|---|---|
| Fix the heatmap colors | Fixed. `HeatmapChart` and `ChoroplethChart` take a typed `colorScale`, sequential or diverging. Fills are `color-mix()` values of theme tokens. The legend shows a gradient. `valueLabels` prints cell values. |
| Highlight cells, bars, and time ranges | Added `highlights` on `LineChart`, `AreaChart`, `StackedAreaChart` (ranges and events), `BarChart` and `DumbbellChart` (category bands), and `HeatmapChart` (cell outlines). Highlights appear in the legend and the description. |
| Put the toolbar in the title row | Done. The header and corner actions share the first row. Secondary controls have a full-width row. Full screen preserves these regions. |
| Cross-filtering | Added `selection` on `BarChart`, `DumbbellChart`, and `HeatmapChart` (click, Enter, Space), `useCrossFilter`, `FilterBar`, `SelectControl`, and `ActiveFilters`. Host filtering uses a pre-aggregated cube. |
| Compare like with like | The Dashboard artifact heatmap no longer parses computed colors. All artifact paints fall back to literal colors when a host token is missing. Both pages were captured with the same headless browser at 1440 px. |
| Darker page, lighter cards | Applied in the case study page. Guidance added to the skill. |
| Hide the data button by default | The API default was already hidden. The catalog enabled it on every chart and the skill told agents to enable it. Both are fixed. |
| "Where did it drop" visual | Added `DumbbellChart`. |
| Legend does not match marks | Fixed. Swatches use one shape for bars, areas, and cells. Lines keep dashes. Points keep size. Scatter, beeswarm, ECDF, radar, network, route, waterfall, and candlestick legends now match their marks. One-series legends are removed. |
| Muted text by default | Axis titles use the muted token at weight 500. The skill and `docs/agents/chart-design.md` define the emphasis hierarchy. |

Other fixes found during the work:

- Band scales passed as factories reordered categories when a highlight or
  selection band was drawn first. Band domains are now configured instances.
- The heatmap tooltip showed the two axis labels but not the value.
- Single-category bar charts drew one full-height bar. Bars are capped at 32 px.
- The running Storybook still served TanStack 0.11.1 after the upgrade to
  1.1.0, so every story failed in it. It was restarted.

## Open items

- The default categorical palette still fails the data-visualization validator
  in both modes (chroma floor and adjacent color-blind separation).
- Done later the same day: `StatTile` and `Sparkline` replace the host-built
  headline tiles in the case study.
- Aperture has no aggregation index for cross-filtering. The host chooses the
  method by data location; the skill documents three patterns. ADR 0011 records
  this boundary. Filter state supports uncontrolled, controlled, and provider use.
- The parallel Storybook test run drops its browser connection on this machine
  when a Storybook dev server runs at the same time. It passes without one.

## What Aperture did well

- Every chart has an exact-value table, keyboard focus with tooltips,
  calendar-aware ticks with context, grouped tooltip totals, dash patterns per
  line series, full screen, and typed loading, empty and error states.
- The typed props found two mistakes at compile time (a non-literal
  `seriesOrder` and a nullable bar value).
- The specification CLI forced the population, numerator, denominator,
  exclusions and missing-value meaning to be written before any code.
- All 61 story tests pass, including accessibility checks, in a serial run.

## Validation record

- Workspace typecheck and build: pass.
- Package check: pass for `@kevin-courbet/aperture@0.6.0`.
- `pnpm validate`: typecheck, build, 32 story files with 63 tests, and the package check pass.
- `bun skills/create-data-visualizations/scripts/chart validate-spec`: 9 of 9
  specifications pass, including a `dumbbell` specification.
- Palette validator: `node validate_palette.js` from the data-visualization
  skill, run on the light and dark Aperture palettes against `#ffffff` and
  `#111827`.
