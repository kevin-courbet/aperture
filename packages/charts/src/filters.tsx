import { createContext, use, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue, type Key } from 'react-aria-components'
import { useChartConfiguration } from './provider.js'
import type { CategorySelection } from './types.js'
import { useOptionalChartWidget } from './widget.js'

const FilterBarContext = createContext(false)

export interface FilterBarProps {
  readonly children: ReactNode
  /** Accessible name of the filter group. Defaults to the provider message. */
  readonly label?: string
  readonly className?: string
}

/**
 * Page-level row of filters that scope every chart below it. It provides the
 * Aperture theme tokens for controls placed outside a chart widget.
 */
export function FilterBar({ children, label, className }: FilterBarProps) {
  const { messages } = useChartConfiguration()
  return (
    <FilterBarContext value={true}>
      <div
        data-aperture-root=""
        role="group"
        aria-label={label ?? messages.filters.group}
        className={['aperture-filter-bar', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </FilterBarContext>
  )
}

function useRequireControlHost(component: string) {
  const insideFilterBar = use(FilterBarContext)
  const widget = useOptionalChartWidget()
  if (!insideFilterBar && widget === null) {
    throw new Error(`${component} must be inside FilterBar or ChartWidget.Root.`)
  }
}

export interface SelectOption<TValue extends string> {
  readonly value: TValue
  readonly label: string
}

export interface SelectControlProps<TValue extends string> {
  readonly label: string
  readonly value: TValue | null
  readonly options: readonly [SelectOption<TValue>, ...SelectOption<TValue>[]]
  readonly onChange: (value: TValue | null) => void
  /** Label of the option that clears the value, such as "All regions". Required when value can be null. */
  readonly allLabel?: string
}

// A key that no option can use, so the clearing option never collides with data.
const allKey = '\u0000all'

/** A single-value dropdown for a dimension filter. The host owns the value. */
export function SelectControl<TValue extends string>({ label, value, options, onChange, allLabel }: SelectControlProps<TValue>) {
  useRequireControlHost('SelectControl')
  const { icons } = useChartConfiguration()
  const Chevron = icons.chevron
  const seen = new Set<string>()
  for (const option of options) {
    if (option.value === allKey) throw new RangeError('SelectControl option values must not use the reserved clearing key.')
    if (seen.has(option.value)) throw new RangeError(`SelectControl option values must be unique: ${option.value}`)
    seen.add(option.value)
  }
  if (value === null && allLabel === undefined) {
    throw new RangeError('SelectControl requires allLabel when value is null.')
  }
  if (value !== null && !seen.has(value)) {
    throw new RangeError(`SelectControl value is not an option: ${value}`)
  }
  const anchorRef = useRef<HTMLDivElement>(null)
  const [portalContainer, setPortalContainer] = useState<Element | undefined>(undefined)
  // Render the popover inside the nearest Aperture root so it inherits theme
  // tokens and stays visible when that root is the full-screen element.
  useLayoutEffect(() => {
    const root = anchorRef.current?.parentElement?.closest('[data-aperture-root]') ?? undefined
    setPortalContainer(root)
  }, [])

  function change(key: Key | null) {
    if (key === null) return
    if (key === allKey) {
      onChange(null)
      return
    }
    const option = options.find((candidate) => candidate.value === key)
    if (option === undefined) throw new RangeError(`SelectControl received an unknown key: ${String(key)}`)
    onChange(option.value)
  }

  const items = allLabel === undefined ? options : [{ value: allKey, label: allLabel }, ...options]
  return (
    <div ref={anchorRef} className="aperture-select-host">
      <Select className="aperture-select" selectedKey={value ?? allKey} onSelectionChange={change}>
        <Label className="aperture-select-label">{label}</Label>
        <Button className="aperture-control aperture-select-trigger">
          <SelectValue />
          <Chevron aria-hidden="true" />
        </Button>
        <Popover className="aperture-popover" placement="bottom start" offset={4} UNSTABLE_portalContainer={portalContainer}>
          <ListBox className="aperture-listbox">
            {items.map((option) => (
              <ListBoxItem key={option.value} id={option.value} textValue={option.label} className="aperture-listbox-item">
                {option.label}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </Select>
    </div>
  )
}

export type CrossFilterValues<TDimension extends string> = { readonly [K in TDimension]: string | null }

export interface ActiveCrossFilter<TDimension extends string> {
  readonly dimension: TDimension
  readonly value: string
}

export interface CrossFilter<TDimension extends string> {
  readonly values: CrossFilterValues<TDimension>
  /** Active filters in dimension declaration order. */
  readonly active: readonly ActiveCrossFilter<TDimension>[]
  readonly set: (dimension: TDimension, value: string | null) => void
  /** Sets several dimensions in one change, such as the region and device of a matrix cell. */
  readonly update: (values: Partial<CrossFilterValues<TDimension>>) => void
  readonly clear: (dimension?: TDimension) => void
  /** Selection props for a chart that filters this dimension. */
  readonly selection: (dimension: TDimension) => CategorySelection
}

/**
 * Uncontrolled state starts from `defaultValues`. Controlled state comes from
 * `values`, for example the URL or an application store, and every change
 * calls `onChange` with the complete next values.
 */
export type CrossFilterOptions<TDimension extends string> =
  | {
      readonly defaultValues: CrossFilterValues<TDimension>
      readonly values?: never
      readonly onChange?: never
    }
  | {
      readonly values: CrossFilterValues<TDimension>
      readonly onChange: (values: CrossFilterValues<TDimension>) => void
      readonly defaultValues?: never
    }

function sameValues<TDimension extends string>(dimensions: readonly TDimension[], left: CrossFilterValues<TDimension>, right: CrossFilterValues<TDimension>) {
  return dimensions.every((dimension) => left[dimension] === right[dimension])
}

function validateValues<TDimension extends string>(dimensions: readonly TDimension[], values: CrossFilterValues<TDimension>) {
  const keys = Object.keys(values)
  if (keys.length !== dimensions.length || keys.some((key) => !dimensions.some((dimension) => dimension === key))) {
    throw new RangeError(`Cross-filter values must keep the dimensions ${dimensions.join(', ')}.`)
  }
  for (const dimension of dimensions) {
    const value = values[dimension]
    if (value !== null && typeof value !== 'string') {
      throw new TypeError(`Cross-filter value for ${dimension} must be a string or null.`)
    }
  }
}

/**
 * Holds one value per filter dimension for linked charts. The host filters and
 * aggregates data from `values`. A chart that sets a dimension usually ignores
 * its own dimension so the reader can change the selection in place.
 */
export function useCrossFilter<TDimension extends string>(options: CrossFilterOptions<TDimension>): CrossFilter<TDimension> {
  const controlled = options.values !== undefined
  const [initialMode] = useState(controlled)
  if (initialMode !== controlled) throw new Error('useCrossFilter cannot switch between controlled and uncontrolled values.')
  if (controlled && typeof options.onChange !== 'function') throw new TypeError('Controlled cross-filter values require onChange.')
  const [internal, setInternal] = useState<CrossFilterValues<TDimension>>(() => {
    const initial = options.values ?? options.defaultValues
    if (initial === undefined) throw new TypeError('useCrossFilter requires values or defaultValues.')
    return initial
  })
  const values = options.values ?? internal
  // Dimensions are fixed for the hook lifetime so callbacks keep a stable identity.
  const [dimensions] = useState(() => Object.keys(values) as TDimension[])
  validateValues(dimensions, values)
  // Several changes in one event must compose before the next render, so each
  // change starts from the latest committed values instead of the render values.
  const latest = useRef(values)
  latest.current = values
  const onChange = useRef(options.onChange)
  onChange.current = options.onChange
  const commit = useCallback((next: CrossFilterValues<TDimension>) => {
    validateValues(dimensions, next)
    if (sameValues(dimensions, latest.current, next)) return
    latest.current = next
    if (controlled) onChange.current?.(next)
    else setInternal(next)
  }, [controlled, dimensions])
  const update = useCallback((partial: Partial<CrossFilterValues<TDimension>>) => {
    commit({ ...latest.current, ...partial })
  }, [commit])
  const set = useCallback((dimension: TDimension, value: string | null) => {
    if (!dimensions.includes(dimension)) throw new RangeError(`Unknown cross-filter dimension: ${dimension}`)
    commit({ ...latest.current, [dimension]: value })
  }, [commit, dimensions])
  const clear = useCallback((dimension?: TDimension) => {
    if (dimension !== undefined) {
      set(dimension, null)
      return
    }
    commit(Object.fromEntries(dimensions.map((key) => [key, null])) as CrossFilterValues<TDimension>)
  }, [commit, dimensions, set])
  return useMemo(() => ({
    values,
    active: dimensions.flatMap((dimension) => {
      const value = values[dimension]
      return value === null ? [] : [{ dimension, value }]
    }),
    set,
    update,
    clear,
    selection: (dimension: TDimension) => ({ value: values[dimension], onChange: (value: string | null) => set(dimension, value) }),
  }), [values, dimensions, set, update, clear])
}

export type CrossFilterProviderProps<TDimension extends string> = CrossFilterOptions<TDimension> & { readonly children: ReactNode }

function providerOptions<TDimension extends string>(props: CrossFilterProviderProps<TDimension>, name: string): CrossFilterOptions<TDimension> {
  if (props.defaultValues !== undefined) return { defaultValues: props.defaultValues }
  if (props.values === undefined || props.onChange === undefined) {
    throw new TypeError(`${name}.Provider requires defaultValues, or values with onChange.`)
  }
  return { values: props.values, onChange: props.onChange }
}

export interface CrossFilterContext<TDimension extends string> {
  /** Holds the filter state for every component below it. */
  readonly Provider: (props: CrossFilterProviderProps<TDimension>) => ReactNode
  /** Reads the filter state from the nearest Provider of this context. */
  readonly useFilters: () => CrossFilter<TDimension>
}

/**
 * Creates a typed filter context for charts in separate components. Create it
 * once at module level. Each call creates an independent filter group, so a
 * page can hold more than one.
 */
export function createCrossFilter<TDimension extends string>(name = 'CrossFilter'): CrossFilterContext<TDimension> {
  const Context = createContext<CrossFilter<TDimension> | null>(null)
  function Provider(props: CrossFilterProviderProps<TDimension>) {
    const filters = useCrossFilter(providerOptions(props, name))
    return <Context value={filters}>{props.children}</Context>
  }
  function useFilters() {
    const filters = use(Context)
    if (filters === null) throw new Error(`${name} filters are only available inside ${name}.Provider.`)
    return filters
  }
  return { Provider, useFilters }
}

export interface ActiveFiltersProps<TDimension extends string> {
  readonly filters: CrossFilter<TDimension>
  readonly labels: { readonly [K in TDimension]: string }
}

/** Removable chips for the active filters and one control that clears them all. */
export function ActiveFilters<TDimension extends string>({ filters, labels }: ActiveFiltersProps<TDimension>) {
  useRequireControlHost('ActiveFilters')
  const { messages, icons } = useChartConfiguration()
  const Remove = icons.remove
  const summary = filters.active.length === 0
    ? messages.filters.none
    : `${messages.filters.active}: ${filters.active.map((filter) => `${labels[filter.dimension]} ${filter.value}`).join(', ')}.`
  return (
    <div className="aperture-active-filters">
      <p className="aperture-visually-hidden" role="status">{summary}</p>
      {filters.active.length === 0
        ? <span className="aperture-active-filters-empty" aria-hidden="true">{messages.filters.none}</span>
        : (
          <>
            <ul className="aperture-filter-chips" aria-label={messages.filters.active}>
              {filters.active.map((filter) => (
                <li key={filter.dimension} className="aperture-filter-chip">
                  <span>{labels[filter.dimension]}: <strong>{filter.value}</strong></span>
                  <Button
                    className="aperture-chip-remove"
                    aria-label={`${messages.filters.remove}: ${labels[filter.dimension]} ${filter.value}`}
                    onPress={() => filters.set(filter.dimension, null)}
                  >
                    <Remove aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button className="aperture-control aperture-clear-filters" onPress={() => filters.clear()}>{messages.filters.clearAll}</Button>
          </>
        )}
    </div>
  )
}
