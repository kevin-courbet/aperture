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

## Storybook Adapter

```sh
bun "$SKILL_DIR/scripts/chart" storybook status --json
bun "$SKILL_DIR/scripts/chart" storybook instructions --json
bun "$SKILL_DIR/scripts/chart" storybook list --with-story-ids --json
bun "$SKILL_DIR/scripts/chart" storybook docs <component-id> --json
bun "$SKILL_DIR/scripts/chart" storybook preview <story-id> [story-id ...] --json
bun "$SKILL_DIR/scripts/chart" storybook test [story-id ...] --json
```

The adapter uses Storybook's MCP endpoint. Configure it with:

```sh
APERTURE_MCP_URL=http://localhost:6006/mcp
```

The CLI keeps Storybook optional. It discovers the available MCP tools before
each operation and reports an unavailable service when the required tool is not
present. Chart selection and specification validation work without a server.

## Future MCP Layer

Implement a future MCP server as an adapter over the CLI TypeScript modules or
the same stable JSON commands. Do not duplicate chart rules, validation, or
Storybook protocol code in the MCP layer.
