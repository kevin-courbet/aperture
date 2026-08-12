# Aperture

Aperture is a React chart component library built on TanStack Charts. It
exports typed charts, widget slots, controls, exact-value tables, semantic CSS
tokens, and replaceable icons.

The React library is implemented in this repository. Its API is not stable and
the package is not published.

- Integrate composable React widgets into an application and match its design system.

Standalone HTML generation is planned for coding agents and chatbots that
create one-off reports and analysis output.

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
pnpm typecheck
pnpm build
```

The repository contains:

- `packages/charts`: the `@kevin-courbet/aperture` React package.
- `apps/catalog`: the Storybook design and behavior catalog.

TanStack Charts is pinned to `0.11.1`. Its API is pre-alpha. Common Aperture
exports do not expose TanStack types. Use `@kevin-courbet/aperture/tanstack`
only for advanced TanStack integration.

## License

MIT
