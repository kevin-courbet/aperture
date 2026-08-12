# Aperture

Aperture is a React chart design system built on TanStack Charts.
It gives developers and coding agents one chart API for React applications and
standalone pages.

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
