# Standalone HTML Reports

## Current Capability

Aperture standalone HTML generation is planned, not implemented. Do not import a
nonexistent renderer or present standalone generation as an Aperture feature.

Until that product path exists, create standalone charts as semantic offline HTML
and validate them with the bundled CLI. Keep the chart specification compatible
with the future renderer boundary.

Start from `assets/standalone-report-template.html` when the host project has no
report shell. Replace every placeholder and adapt the layout to the report. Use
`assets/examples/standalone-evaluation.json` as a specification example, not as
report data. Create and validate one specification per chart.

## Delivery Modes

Choose one mode explicitly:

- `single-file`: inline all CSS, scripts, fonts, data, and visual assets.
- `bundle`: include the HTML file and every relative artifact it references.

Do not use CDN scripts, remote fonts, analytics, or runtime APIs for an offline
report. Verify all relative links in bundle mode.

For small-screen charts, change the composition, tick density, and labels. Do
not scale a wide desktop SVG until its text is unreadable. Keep chart text at a
readable CSS size or provide a contained horizontal plot scroller.
Make each horizontal chart or table scroller keyboard-focusable and give it an
accessible name that explains the overflow.

## Required Structure

- HTML5 doctype and document language.
- Descriptive document title and viewport metadata.
- Report header with scope, period, and status.
- One section per analytical question.
- Chart title, description, units, references, and source.
- Accessible exact-value table for each chart.
- Provenance section.
- Caveats and excluded populations where they affect interpretation.

For SVG charts, add `role="img"`, `<title>`, and `<desc>`. Keep the full values
in HTML rather than SVG text alone.

## Provenance

For analytical and evaluation reports, include when available:

- Dataset and cohort.
- Experiment and run identifiers.
- Commit.
- Completion timestamp.
- Execution mode and concurrency.
- Model and evaluator version.
- Invalid or interrupted attempts.
- Source artifact links.

Do not label an iteration `Final` when later evaluation attempts or unresolved
failures exist. Do not describe a full cohort as successful when the measure
applies only to a subset without showing both populations.

## Audit

Run:

```sh
bun "$SKILL_DIR/scripts/chart" audit-html report.html --delivery single-file --json
```

The audit checks structural and static offline requirements. Also load the file
in a browser with network requests blocked and verify that it renders without
requests. The audit does not prove data accuracy, visual contrast, keyboard
order, or whether the chosen chart answers the question. Verify those
separately.
