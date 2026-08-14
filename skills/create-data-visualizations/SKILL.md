---
name: create-data-visualizations
description: Create or review data visualizations, React chart widgets, and chart-based dashboards with Aperture. Use for chart selection, TanStack Charts, controls, time ranges, fullscreen, theming, exact values, accessibility, responsive charts, and chart UX. Use the separate create-data-reports skill for standalone reports.
---

# Create Data Visualizations

Create decision-ready charts with consistent data semantics, interaction,
accessibility, responsive behavior, and visual quality across projects.

## Required Workflow

1. Read `references/workflow.md` and `references/chart-selection.md`.
2. Read `references/data-accessibility.md` before defining data or metrics.
3. For React, read `references/react-aperture.md` and use Aperture when it is available.
4. For a standalone report, read `references/standalone-html.md` and switch to the separate report workflow.
5. Read `references/design-ux.md` before styling or adding controls.
6. Create and validate one versioned chart specification per chart before implementation when scope is not trivial.
7. Read `references/validation.md` before handoff.

## CLI

Resolve all skill paths from the support directory printed by `skills use`.
Keep the project directory as the working directory so project file paths stay
direct. The CLI requires Bun. Run it with:

```sh
bun "$SKILL_DIR/scripts/chart" capabilities --json
```

Use `schema`, `validate-spec`, and `storybook` commands as
documented in `references/cli.md`. Treat non-zero exit status as a failure.

## Non-Negotiables

- Start with the reader's question and decision, not a chart type.
- Define population, units, denominators, exclusions, source, locale, time zone,
  and missing-value meaning.
- Provide semantic exact values for every chart.
- Keep data access and business aggregation outside chart components.
- Add only controls that change the reader's analysis.
- Never use color as the only signal.
- Never hide errors or unsupported states behind an empty chart.
- Validate React charts through Storybook when the project exposes it.
- Redirect standalone report work to the Reports skill and renderer.
