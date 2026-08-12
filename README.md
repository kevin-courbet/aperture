# Aperture

Aperture is an opinionated React chart design system built on TanStack Charts.
It aims to give application developers and coding agents the same high-quality
chart defaults across product interfaces and one-off documents.

This repository currently contains the initial validation catalog. It tests:

- Composable chart widgets and controls.
- Strict TypeScript data and formatter contracts.
- React Aria controls and replaceable icons.
- Semantic CSS tokens and stable structural slots.
- Explicit locale and timezone formatting.
- Accessible exact-value tables and keyboard chart navigation.
- Honest single-observation presentation instead of a false trend.
- Responsive product and one-off chart contexts.

## Development

Requirements: Node.js 22 or later.

```sh
npm install
npm run dev
```

Validation:

```sh
npm run typecheck
npm run build
```

## Status

Aperture is an early validation prototype. The public package API, package
scope, performance budgets, and chart-family coverage are not stable yet.

TanStack Charts is pinned to `0.11.1` because its API is currently pre-alpha.

## License

MIT
