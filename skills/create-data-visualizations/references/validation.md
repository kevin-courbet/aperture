# Validation And Review

## Data

- Does the chart answer the stated question?
- Are grain, population, denominator, exclusions, units, and missing values
  explicit?
- Do displayed values match source artifacts?
- Are loading, empty, error, and ready states distinct?
- Are one-result cases shown without a false trend?

## Visual Design

- Does the chart match the host design system?
- Is one signal dominant?
- Are axes, labels, references, and legends readable?
- Does mobile adapt rather than only shrink?
- Are controls justified by a reader task?
- Are colors semantic and distinguishable without color alone?

## Accessibility

- Accessible name and description.
- Semantic exact-value table.
- Keyboard interaction and visible focus.
- Tooltip values available without pointer hover.
- Reduced motion and forced colors.
- Focus restoration after fullscreen.
- WCAG 2.2 AA automated check plus manual semantic review.

## React

- Verified Aperture props and exports.
- Host owns data, aggregation, and controlled state.
- Common API used before advanced TanStack exports.
- Story covers meaningful states and interactions.
- Story tests pass with accessibility enabled.
- New tests remain one-off unless the user explicitly requires committed
  coverage. Committed tests prove semantics or interaction, not presentation.
- Preview URL reviewed at desktop and mobile widths.

## Standalone HTML

- Explicit single-file or bundle delivery.
- No undeclared remote dependency.
- All relative links resolve.
- SVG title and description where SVG is used.
- Exact values are in HTML.
- Provenance and caveats are complete.
- CLI audit passes.

## Handoff

Report:

- Chart question and chosen family.
- Data and accessibility constraints.
- Validation commands and results.
- Storybook preview URLs for React work.
- Remaining limits, including unsupported standalone Aperture generation.
