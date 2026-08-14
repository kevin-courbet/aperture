# Chart Creation Workflow

## 1. Establish Context

Confirm these facts before selecting a chart:

- Reader and usage context.
- Question the chart must answer.
- Decision or action the answer supports.
- Dataset grain and expected maximum row count.
- Field types and stable identifiers.
- Unit, denominator, population, exclusions, and missing-value meaning.
- Source, freshness, locale, and time zone.
- Target: React application or standalone HTML report.

Stop and ask when any fact can change the meaning of the result. Do not infer a
denominator, exclusion, target, or missing-value meaning from the data shape.

## 2. Inspect The Host

Read repository instructions, package scripts, existing design tokens, chart
dependencies, and nearby chart components. Preserve the host design system.

For React projects:

1. Check for `@kevin-courbet/aperture`.
2. Check for a local Aperture checkout or workspace dependency.
3. Check whether Storybook exposes the Aperture MCP endpoint.
4. Use the common Aperture API before `@kevin-courbet/aperture/tanstack`.

Do not silently add another chart library when Aperture is unavailable. Report
the missing dependency and resolve the integration path with the user.

## 3. Model The Chart

Use one chart specification per chart for non-trivial work. Set `SKILL_DIR` to
the skill support directory printed by `skills use`:

```sh
bun "$SKILL_DIR/scripts/chart" schema chart-spec --json
bun "$SKILL_DIR/scripts/chart" validate-spec chart.json --json
```

The specification records intent, data state, encodings, controls, accessibility,
delivery, and provenance. It is the stable boundary for the CLI and a future MCP
adapter. It is not a rendering API.

## 4. Select The Chart

Use `chart-selection.md`. Select the simplest chart that answers the question.
Reject a requested chart when it distorts the data or hides the required
comparison. Explain the replacement in terms of the reader's task.

## 5. Compose The Experience

Build in this order:

1. Title that states the subject.
2. Description that defines the measure and scope.
3. Chart with units and labeled references.
4. Legend when series or encodings need explanation.
5. Exact-value table or disclosure.
6. Source and freshness.
7. Controls that materially change the analysis.
8. Loading, empty, error, and ready states.

Do not start with a toolbar. A control is justified only when the reader needs
to change range, series visibility, selection, zoom, disclosure, or presentation.

## 6. Implement

For React, compose Aperture widget slots. Keep controlled state in the host. Use
advanced TanStack exports only when the common API cannot represent the required
interaction or mark.

For standalone HTML, produce an offline semantic artifact. Inline required CSS,
scripts, and data for a single-file delivery. Use SVG or Canvas only when an HTML
table and text summary preserve the same result.

## 7. Validate

- Run type checks and project tests.
- Validate the chart specification.
- Use Storybook story tests and previews for React visual changes. Do not commit
  new tests unless the user explicitly requires coverage; committed tests must
  prove accessible semantics or user interaction, not visual presentation.
- Audit standalone HTML.
- Test desktop and mobile layouts.
- Test keyboard access, visible focus, reduced motion, and forced colors.
- Compare displayed values with source data.

Do not report completion with unresolved diagnostics.
