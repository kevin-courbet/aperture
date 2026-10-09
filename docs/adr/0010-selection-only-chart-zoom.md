# Selection-Only Chart Zoom

## Status

Accepted on 2026-10-09.

## Decision

The user requested horizontal drag-to-select behavior without visible pointer handles or a persistent selection.
Pointer hover can show a cursor. Holding the pointer and moving horizontally defines a range for the host to apply.
The user approved implementation in Aperture and publication of a release for Fiber.

## Consequences

Aperture owns this interaction. Fiber does not implement a separate brush or override private chart DOM styles.
Keyboard interaction retains visible focus and accessible range controls.
