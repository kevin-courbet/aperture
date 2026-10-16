# Bundled Chart CLI

## Contract

Set `SKILL_DIR` to the skill support directory printed by `skills use`, then run:

```sh
bun "$SKILL_DIR/scripts/chart"
```

All operational commands return a versioned JSON envelope. `--json` is accepted
for explicit agent intent. Commands never prompt.

Exit status:

| Status | Meaning |
|---|---|
| 0 | Command succeeded and validation passed |
| 2 | Invalid command or arguments |
| 3 | Input, specification, or artifact validation failed |
| 4 | Optional external service is unavailable |
| 5 | Internal CLI failure |

## Discovery

```sh
bun "$SKILL_DIR/scripts/chart" capabilities --json
bun "$SKILL_DIR/scripts/chart" schema chart-spec --json
bun "$SKILL_DIR/scripts/chart" schema command-result --json
```

`capabilities` is the machine-readable tool catalog. Each command includes its
input shape, output shape, and external requirements. This is the discovery
boundary a future MCP adapter can expose without duplicating logic.

## Specification

```sh
bun "$SKILL_DIR/scripts/chart" validate-spec chart.json --json
bun "$SKILL_DIR/scripts/chart" validate-spec - --json < chart.json
```

The command applies schema-boundary and semantic validation. It reports all
known diagnostics in one run. It does not render a chart.

Example specifications are in `assets/examples/`.

## Catalog Adapter

The Aperture catalog runs on Ladle. Start it in an Aperture checkout with
`pnpm dev`.

```sh
bun "$SKILL_DIR/scripts/chart" catalog status --json
bun "$SKILL_DIR/scripts/chart" catalog list --json
bun "$SKILL_DIR/scripts/chart" catalog preview <story-id> [story-id ...] --json
bun "$SKILL_DIR/scripts/chart" catalog test [story-id ...] --repo <aperture-checkout> --json
```

- `status` and `list` read the story index from the running catalog. `list`
  returns each story ID, name, title, and description.
- `preview` checks the story IDs and returns the catalog URL and an isolated
  URL for each story.
- `test` runs the story tests in the Aperture checkout. Each test renders the
  story in Chromium, checks WCAG 2.2 AA rules with axe, and runs the story
  play. Without story IDs, it runs every story. It does not need a running
  catalog.

Set `APERTURE_CATALOG_URL` when the catalog does not run at
`http://127.0.0.1:6006/`. Set `APERTURE_REPO` instead of `--repo`. A remote
catalog URL requires `APERTURE_CATALOG_ALLOW_REMOTE=1`.

The catalog commands are optional. Chart selection and specification
validation work without a catalog. An unreachable catalog returns exit code 4.

## Future MCP Layer

Implement a future MCP server as an adapter over the CLI TypeScript modules or
the same stable JSON commands. Do not duplicate chart rules, validation, or
catalog code in the MCP layer.
