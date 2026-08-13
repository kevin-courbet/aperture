# Aperture

Aperture is a React chart component library built on TanStack Charts. It
includes typed charts, widget slots, controls, exact-value tables, semantic CSS
tokens, and replaceable icons.

The API is unstable while Aperture is in the `0.x` release series.

## Install

```sh
pnpm add @kevin-courbet/aperture react react-dom
```

Import components from `@kevin-courbet/aperture`. Browser-aware bundlers load
the Aperture styles through the package browser export.

```tsx
import { ChartProvider, LineChart } from '@kevin-courbet/aperture'
```

Import `@kevin-courbet/aperture/styles.css` when the build does not use package
browser exports.

Use `@kevin-courbet/aperture/tanstack` only when the common API does not meet
an advanced chart requirement. TanStack Charts is pre-alpha and pinned by
Aperture.
