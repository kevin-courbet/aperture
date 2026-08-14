# Data And Accessibility

## Data Contract

Define every quantitative field with:

- Human label.
- Unit and decimal display precision.
- Population and denominator where applicable.
- Aggregation rule.
- Missing-value meaning.
- Source and freshness.

Represent temporal fields as ISO year-month (`YYYY-MM`), calendar date
(`YYYY-MM-DD`), or date-time with an explicit UTC offset. Do not use ambiguous
localized date strings in a chart specification.

Record freshness as an exact as-of date or date-time, a stated update schedule,
or an explicit unknown state with a reason. Do not put unknown or cadence text
in an as-of value.

Keep these states distinct:

- Loading: data is not available yet.
- Empty: valid query returned no observations.
- Error: data or rendering failed.
- Ready: at least one valid observation exists.

Do not use zero for missing data. Do not use an empty array for a failed query.
Do not convert excluded or not-applicable rows into successes.

## Metric Integrity

For rates and evaluation results, show or disclose:

- Numerator.
- Denominator.
- Full population.
- Applicable population.
- Exclusions and not-applicable rows.
- Technical failures separately from business mismatches.
- Baseline, final result, target, and change magnitude.

Validate displayed numbers against source artifacts. If the report uses linked
artifacts, verify every link and state whether the HTML file is self-contained
or requires a bundle.

## Accessible Chart Contract

Every chart must provide:

- Accessible name.
- Description that states measure, scope, and notable reference values.
- Semantic exact values in an HTML table or equivalent structured content.
- Keyboard access for interactive controls and chart navigation.
- Visible focus.
- Non-color signals for series, status, and selection.
- Reduced-motion behavior.
- Forced-colors behavior.
- Text for loading, empty, and error states.

Use a table caption. Mark a suitable first column as row headers. Keep units in
column labels or cells. Include missing values as explicit text such as `Not
reported`.

## Interaction

- Pointer hover is an enhancement, not the only route to values.
- Tooltip content must also be available by keyboard or exact-value disclosure.
- Restore focus after fullscreen or temporary presentation modes.
- Keep focus inside modal fullscreen implementations. Prefer the browser
  Fullscreen API when its behavior fits the product.
- Give selection controls an accessible group name and selected state.
- Do not remove outlines. Replace them only with a visible focus indicator.

## Testing

Use WCAG 2.2 AA as the minimum target. Automated checks do not prove chart
meaning, keyboard order, data accuracy, or non-color comprehension. Test those
behaviors manually or through semantic interaction tests.
