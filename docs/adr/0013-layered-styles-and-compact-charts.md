# ADR 0013: Layered Styles And Compact Charts

## Status

Accepted

## Decision

Aperture puts every stylesheet rule in the `aperture` cascade layer. The
browser export continues to load the stylesheet, so the common API includes
default styles.

A chart's `className` and `style` apply to the element that carries
`data-aperture-root`. A standalone chart applies them to its widget root.

`AreaChart` and `LineChart` accept `compact`. A compact chart draws one series
without axes, grid lines, legend, or standalone controls. The tooltip and the
exact-value table stay available. A compact chart rejects options that it
cannot show.

## Consequences

Host theme rules override Aperture without a specificity contest. Before this
decision, the dark-theme rule `[data-theme='dark'] [data-aperture-root]` beat a
single host class, so a host bridge kept the Aperture dark surface and font.

Unlayered host element rules, such as `button` or `table` rules, also override
Aperture. Hosts that use cascade layers declare `aperture` before their own
layers.

Stat tiles can use a compact chart when the reader needs exact values on
hover. `Sparkline` remains the static trend without interaction.
