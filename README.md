# Aperture

Aperture is a React chart design system built on TanStack Charts.
It gives developers and coding agents one chart API for React applications and
standalone pages.

The current catalog demonstrates:

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
npm install
npm run dev
```

Validate changes:

```sh
npm run typecheck
npm run build
```

TanStack Charts is pinned to `0.11.1`. Its API is pre-alpha.
The current repository is a catalog. It is not a published component package.

## License

MIT
