# Chart Selection

Select by analytical question, not by visual novelty.

| Goal | Preferred chart | Use when | Avoid when |
|---|---|---|---|
| Change over time | Line | Ordered time points and trend matter | One result or unordered categories |
| Cumulative change | Area | Magnitude plus trend matters | Overlap hides independent series |
| Compare categories | Horizontal bar | Labels are long or ranking matters | Categories are ordered time points |
| Compare categories | Vertical bar | Few compact categories | Labels or category count cause crowding |
| Part of whole | Stacked bar | Comparing composition across groups | Precise segment comparison is primary |
| Part of whole | Donut | One small, stable composition | Many slices, close values, or multiple totals |
| Distribution | Histogram | Bin shape matters | Exact observations or tiny samples |
| Distribution | Box plot | Compact group comparison | Reader needs raw density or modes |
| Distribution | Violin/density | Shape and modes matter | Sample is small or precision is primary |
| Relationship | Scatter | Two quantitative measures | Time order or category rank is primary |
| Uncertainty | Range/error bar | Estimate and interval must stay together | Interval meaning is undefined |
| Matrix | Heatmap | Two categorical dimensions form a matrix | Exact values cannot be disclosed |
| Geography | Choropleth | Normalized regional rate | Raw totals reflect population size |
| Route | Route map | Paths and geography both matter | Geography adds no analytical value |
| Hierarchy | Treemap | Part-to-whole hierarchy | Precise comparison or deep hierarchy |
| Flow | Sankey | Transfer between stages matters | Flow values or direction are uncertain |
| One result | Result marker/text | One observation or status | A trend is implied by one point |
| Exact lookup | Table | Values and labels are the task | Pattern recognition is primary |

## Accuracy Rules

- Start quantitative bar scales at zero unless a documented analytical reason
  requires another domain.
- Do not connect unknown values. Show gaps.
- Do not draw a trend for one result.
- Label goals, thresholds, forecasts, and confidence intervals directly.
- Use rates for choropleths unless raw totals are the explicit question.
- Do not use 3D effects, decorative marks, dual axes, or unlabeled normalization.
- Limit line series when identification becomes difficult. Use facets or direct
  selection instead.
- Sort categorical bars by analytical order, not alphabetically by default.

## Escalate To Advanced TanStack

Use `@kevin-courbet/aperture/tanstack` only for a requirement such as custom
marks, linked brush state, specialized zoom, or a definition not exposed by the
common Aperture components. Preserve Aperture widget, accessibility, exact-value,
theme, and state contracts around the advanced plot.
