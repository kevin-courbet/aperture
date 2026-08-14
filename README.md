# Aperture

Aperture is a React chart component library built on TanStack Charts. It
exports typed charts, widget slots, controls, exact-value tables, semantic CSS
tokens, and replaceable icons.

The public React package name is `@kevin-courbet/aperture`. Its API is unstable
while Aperture is in the `0.x` release series.

Install a published release:

```sh
pnpm add @kevin-courbet/aperture react react-dom
```

- Integrate composable React widgets into an application and match its design system.

Standalone HTML generation is planned for coding agents and chatbots that
create one-off reports and analysis output.

## Agent Skill

Give this command to an interactive agent before the chart request. The command
returns the skill prompt and its support files for that session:

```sh
npx skills use kevin-courbet/aperture@create-data-visualizations
```

Install it for later sessions:

```sh
npx skills add kevin-courbet/aperture --skill create-data-visualizations -y
```

The skill supports React charts, dashboards, and standalone HTML reports. Its
bundled validation CLI requires Bun.

The Storybook catalog demonstrates:

- Composable widgets and controls.
- Strict TypeScript contracts.
- React Aria controls and replaceable icons.
- Semantic theme tokens and structural slots.
- Explicit locale and time-zone behavior.
- Exact-value tables and keyboard chart navigation.
- A single result without a trend line.

Read [VISION.md](VISION.md) for the product direction.

## Development

Use Node.js 22 or later.

```sh
pnpm install
pnpm dev
```

Validate changes:

```sh
pnpm validate
```

Package releases run on `beast`. IQ validates and signs the exact candidate
commit before it lands. Publication starts only from the clean landed
`origin/main` commit. See [Release](docs/release.md).

The repository contains:

- `packages/charts`: the `@kevin-courbet/aperture` React package.
- `apps/catalog`: the Storybook design and behavior catalog.
- `skills/create-data-visualizations`: the public agent workflow and validation tools.

TanStack Charts is pinned to `0.11.1`. Its API is pre-alpha. Common Aperture
exports do not expose TanStack types. Use `@kevin-courbet/aperture/tanstack`
only for advanced TanStack integration.

## License

MIT
