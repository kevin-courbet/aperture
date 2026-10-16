# ADR 0014: Ladle Catalog

## Status

Accepted

## Decision

The catalog in `apps/catalog` runs on Ladle instead of Storybook. Stories use
the Ladle story format. Each story file can have a `.play.ts` file that exports
one interaction test for each story name.

One Vitest browser test renders every story in Chromium at 1440 × 960 pixels.
It checks the WCAG 2.2 AA axe rules, and then runs the matching play. Each test
name is the Ladle story ID. A story opts out with `parameters.test = false`.

The `create-data-visualizations` CLI replaces its Storybook MCP commands with
`catalog status`, `catalog list`, `catalog preview`, and `catalog test`. The
first three read the Ladle story index. `catalog test` runs the story tests in
an Aperture checkout.

## Consequences

Play files keep test libraries out of the Ladle bundle. The story test is the
only place that applies story decorators outside Ladle. It applies them in the
Ladle order.

The CLI has no component documentation command. Agents read the package README,
the type declarations, and the stories. Story descriptions are in Ladle story
metadata, and `catalog list` returns them.
