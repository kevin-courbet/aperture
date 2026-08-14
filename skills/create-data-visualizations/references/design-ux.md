# Chart Design And UX

## Visual Direction

Match the host application through semantic tokens. Do not impose a generic
dashboard theme. Preserve brand typography, spacing, radius, density, and surface
hierarchy while keeping chart semantics stable.

Use a restrained visual hierarchy:

- One dominant data signal.
- Quiet axes and grid lines.
- Direct labels for references and important endpoints.
- Accent color for meaning, not decoration.
- Neutral surfaces that do not compete with the plot.

Avoid generic card grids, excessive shadows, glass effects, decorative
gradients, glowing dark themes, and chart marks that encode no data.

## Semantic Tokens

Provide tokens for:

- Text, muted text, surface, raised surface, and border.
- Focus and selection.
- Categorical series.
- Positive, negative, warning, and reference values.
- Tooltip and exact-value table.
- Typography, radius, density, and motion.

Do not bind business meaning to a palette index. Map semantic meaning to a token
at the composition boundary.

## Responsive Behavior

- Size charts from their container.
- Adapt composition, labels, and controls; do not only shrink the desktop chart.
- Keep required controls and exact values on mobile.
- Use horizontal bars for long category labels.
- Reduce tick density before reducing text below readable size.
- Allow exact-value tables to scroll horizontally without clipping page content.
- Test the expected minimum and maximum container widths.

## Controls

Add controls only for a reader task:

- Time range: compare relevant periods.
- Series visibility: reduce a dense comparison.
- Exact values: disclose precise observations.
- Fullscreen: inspect a dense chart or present it.
- Brush/zoom: inspect a domain that cannot fit at useful resolution.
- Toggle: switch a defined analytical mode, not a cosmetic option.

Keep controls composable. The host owns controlled state and data filtering.
Controls do not fetch data or encode business aggregation.

## Motion

Use motion to explain state change, selection, or domain transition. Avoid entry
animation that delays reading. Update high-frequency pointer feedback without
causing React render loops. Respect reduced motion in CSS and JavaScript.

## Copy

- Title: subject, not conclusion unless the conclusion is stable and verified.
- Description: measure, population, period, and unit.
- Control labels: direct actions or ranges.
- Error: problem, known cause, and next action.
- Empty: valid reason and scope, not `No data` alone.
