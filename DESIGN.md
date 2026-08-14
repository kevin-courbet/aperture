# Design Context

## Users

The adopter demo is for React developers and coding agents that need a reusable
chart experience across projects. They need to inspect a realistic widget,
compare major chart families, and see how Aperture matches a host design system.

## Brand Personality

Aperture is precise, calm, and credible. The interface must build confidence in
data accuracy, accessibility, and developer control.

## Communication Style

Aperture uses a technical communication style adapted from recurring patterns
in Linear's public product, method, and documentation writing. It does not copy
Linear phrases or imply a relationship with Linear.

### Voice

- Calm, direct, and technical.
- Confident about implemented behavior. Explicit about limits and planned work.
- Concise without removing required context.
- Declarative, not conversational. Describe the library; do not address or
  persuade an imagined buyer.

### Structure

- Lead with the object or capability: `React charts. Composable widgets.`
- Follow with the mechanism: component names, props, defaults, or constraints.
- Put detailed behavior, examples, and limits after the summary.
- Use one idea per sentence and one purpose per section.
- Use short action labels such as `Install`, `View examples`, and `Read the API`.

### Terminology

- Use standard chart and React terms. Prefer `chart`, `series`, `axis`, `widget`,
  `React component`, and `exact-value table`.
- Do not invent a branded term when a standard term is clear.
- Use exact public names for components, props, commands, and UI labels.
- Distinguish implemented, experimental, unstable, and planned behavior.

### Claims

- State implemented capabilities as facts.
- Support quality and performance claims with a test, measurement, or defined
  behavior.
- State compatibility, defaults, limits, and failure conditions directly.
- Do not use broad claims such as `best`, `complete`, `seamless`, `powerful`, or
  unsupported claims about future readiness.
- Keep report composition and generation in the separate Reports product.

### Documentation

- Define a concept and its constraints before the procedure.
- Write task headings with direct verbs: `Create a line chart`, `Add a time
  range control`, `Handle missing values`.
- Use ordered steps for sequences and bullets for independent options.
- Put code next to the behavior it demonstrates.
- For failures, state the problem, known cause, and next action. Do not hide an
  error behind an empty state or a silent fallback.

### Examples

Prefer:

- `React charts. Composable widgets.`
- `TimeRangeControl renders a controlled single-selection group.`
- `The host application owns data access and controlled state.`
- `Use Reports for standalone report composition.`

Avoid:

- `Stop rebuilding chart UX.`
- `Charts your users will love.`
- `Unlock powerful insights at scale.`
- `Everything needed for effortless data stories.`

### Research Sources

These first-party sources informed the adapted rules:

- [Linear homepage](https://linear.app/): short declarative headings, compact
  capability descriptions, and direct action labels.
- [Linear Method: Principles & Practices](https://linear.app/method/introduction):
  clear standard terminology, brevity, and progressive detail.
- [Linear Method: Write issues not user stories](https://linear.app/method/write-issues-not-user-stories):
  plain language, concrete outcomes, and only the context required for action.
- [Linear Docs](https://linear.app/docs) and
  [Create issues](https://linear.app/docs/creating-issues): object definition
  before procedure, exact labels, explicit constraints, notes, and limits.
- [Linear Brand Guidelines](https://linear.app/brand): naming and asset rules.
  This page does not publish a verbal style guide.

## Aesthetic Direction

Use spacious editorial composition, IBM Plex Sans, navy text, neutral off-white
surfaces, a clear blue chart accent, a gold reference accent, thin rules, and
restrained controls. Do not use cream or beige surfaces.

## Design Principles

- Lead with one realistic product widget and the code that creates it.
- State the complete chart experience as the product, not API breadth alone.
- Keep the chart library boundary separate from report composition.
- Show breadth through a compact chart gallery, not a dashboard grid.
- Explain host-theme integration with semantic tokens and replaceable icons.
- Keep exact values, units, sources, and accessible controls near each chart.
- Adapt the composition for mobile without removing important behavior.
