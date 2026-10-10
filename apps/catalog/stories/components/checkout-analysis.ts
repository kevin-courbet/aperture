import {
  checkoutDevices,
  checkoutPayments,
  checkoutRegions,
  checkoutRows,
  type CheckoutDevice,
  type CheckoutPayment,
  type CheckoutRegion,
  type CheckoutRow,
} from '../../src/fixtures/checkout'

export type SliceValue<TValue extends string> = TValue | 'All'

export interface Slice {
  readonly region: SliceValue<CheckoutRegion>
  readonly device: SliceValue<CheckoutDevice>
  readonly payment: SliceValue<CheckoutPayment>
}

export type SliceDimension = keyof Slice

export const sliceDimensions: readonly SliceDimension[] = ['region', 'device', 'payment']

export const allSlice: Slice = { region: 'All', device: 'All', payment: 'All' }

export const sliceOptions = {
  region: checkoutRegions,
  device: checkoutDevices,
  payment: checkoutPayments,
} as const satisfies Record<SliceDimension, readonly string[]>

export const sliceLabels: Record<SliceDimension, string> = { region: 'Region', device: 'Device', payment: 'Payment method' }

export const sliceAllLabels: Record<SliceDimension, string> = {
  region: 'All regions',
  device: 'All devices',
  payment: 'All payment methods',
}

function sliceValue<TValue extends string>(options: readonly TValue[], value: string | null, dimension: SliceDimension): SliceValue<TValue> {
  if (value === null) return 'All'
  const match = options.find((option) => option === value)
  if (match === undefined) throw new RangeError(`Unknown ${dimension} value: ${value}`)
  return match
}

/** Converts cross-filter values, where null means no filter, into a slice. */
export function sliceFromFilters(values: { readonly region: string | null; readonly device: string | null; readonly payment: string | null }): Slice {
  return {
    region: sliceValue(checkoutRegions, values.region, 'region'),
    device: sliceValue(checkoutDevices, values.device, 'device'),
    payment: sliceValue(checkoutPayments, values.payment, 'payment'),
  }
}

export function withSliceValue(slice: Slice, dimension: SliceDimension, value: string): Slice {
  switch (dimension) {
    case 'region':
      return { ...slice, region: sliceValue(checkoutRegions, value === 'All' ? null : value, dimension) }
    case 'device':
      return { ...slice, device: sliceValue(checkoutDevices, value === 'All' ? null : value, dimension) }
    case 'payment':
      return { ...slice, payment: sliceValue(checkoutPayments, value === 'All' ? null : value, dimension) }
  }
}

export function sliceLabel(slice: Slice): string {
  return sliceDimensions.map((dimension) => (slice[dimension] === 'All' ? sliceAllLabels[dimension] : slice[dimension])).join(' · ')
}

export function isFiltered(slice: Slice): boolean {
  return sliceDimensions.some((dimension) => slice[dimension] !== 'All')
}

export type WindowKey = 'before' | 'incident' | 'hotfix'

export interface AnalysisWindow {
  readonly start: string
  readonly end: string
  readonly label: string
  readonly days: number
}

export const windows: Record<WindowKey, AnalysisWindow> = {
  before: { start: '2026-08-17', end: '2026-09-07', label: '17 Aug – 7 Sep', days: 22 },
  incident: { start: '2026-09-08', end: '2026-09-21', label: '8–21 Sep', days: 14 },
  hotfix: { start: '2026-09-22', end: '2026-09-27', label: '22–27 Sep', days: 6 },
}

export function windowOf(date: string): WindowKey {
  if (date < windows.incident.start) return 'before'
  if (date < windows.hotfix.start) return 'incident'
  return 'hotfix'
}

export interface Totals {
  readonly checkouts: number
  readonly shipping: number
  readonly submitted: number
  readonly failed3ds: number
  readonly failedDeclined: number
  readonly failedGateway: number
  readonly orders: number
  readonly cardSubmitted: number
}

const emptyTotals: Totals = {
  checkouts: 0, shipping: 0, submitted: 0, failed3ds: 0, failedDeclined: 0, failedGateway: 0, orders: 0, cardSubmitted: 0,
}

function addRow(totals: Totals, row: CheckoutRow): Totals {
  return {
    checkouts: totals.checkouts + row.checkouts,
    shipping: totals.shipping + row.shipping,
    submitted: totals.submitted + row.submitted,
    failed3ds: totals.failed3ds + row.failed3ds,
    failedDeclined: totals.failedDeclined + row.failedDeclined,
    failedGateway: totals.failedGateway + row.failedGateway,
    orders: totals.orders + row.orders,
    cardSubmitted: totals.cardSubmitted + (row.payment === 'Card' ? row.submitted : 0),
  }
}

function sliceKey(slice: Slice): string {
  return `${slice.region}|${slice.device}|${slice.payment}`
}

/** Every slice that contains a row, including the "All" member of each dimension. */
function slicesOf(row: CheckoutRow): readonly Slice[] {
  const slices: Slice[] = []
  for (const region of ['All', row.region] as const) {
    for (const device of ['All', row.device] as const) {
      for (const payment of ['All', row.payment] as const) slices.push({ region, device, payment })
    }
  }
  return slices
}

/*
 * The cube pre-aggregates every slice once, so a filter change reads totals in
 * constant time instead of scanning the source rows. This is the host-side
 * pattern that keeps cross-filtering fast as the row count grows.
 */
interface CheckoutCube {
  readonly windows: ReadonlyMap<string, Totals>
  readonly days: ReadonlyMap<string, ReadonlyMap<string, Totals>>
  readonly builds: ReadonlyMap<string, ReadonlyMap<string, { submitted: number; failed3ds: number; dates: Set<string> }>>
}

function buildCube(): CheckoutCube {
  const windowTotals = new Map<string, Totals>()
  const dayTotals = new Map<string, Map<string, Totals>>()
  const buildTotals = new Map<string, Map<string, { submitted: number; failed3ds: number; dates: Set<string> }>>()
  for (const row of checkoutRows) {
    const window = windowOf(row.date)
    for (const slice of slicesOf(row)) {
      const key = sliceKey(slice)
      windowTotals.set(`${window}|${key}`, addRow(windowTotals.get(`${window}|${key}`) ?? emptyTotals, row))
      const days = dayTotals.get(key) ?? new Map<string, Totals>()
      days.set(row.date, addRow(days.get(row.date) ?? emptyTotals, row))
      dayTotals.set(key, days)
      if (row.payment === 'Card' && slice.payment === 'All') {
        const builds = buildTotals.get(key) ?? new Map<string, { submitted: number; failed3ds: number; dates: Set<string> }>()
        const current = builds.get(row.build) ?? { submitted: 0, failed3ds: 0, dates: new Set<string>() }
        current.submitted += row.submitted
        current.failed3ds += row.failed3ds
        current.dates.add(row.date)
        builds.set(row.build, current)
        buildTotals.set(key, builds)
      }
    }
  }
  return { windows: windowTotals, days: dayTotals, builds: buildTotals }
}

const cube = buildCube()

export function windowTotals(slice: Slice, window: WindowKey): Totals {
  return cube.windows.get(`${window}|${sliceKey(slice)}`) ?? emptyTotals
}

export interface DailyTotals {
  readonly date: string
  readonly totals: Totals
}

export function dailyTotals(slice: Slice): readonly DailyTotals[] {
  const days = cube.days.get(sliceKey(slice))
  if (days === undefined) return []
  return [...days.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([date, totals]) => ({ date, totals }))
}

export interface BuildTotals {
  readonly build: string
  readonly submitted: number
  readonly failed3ds: number
  readonly days: number
}

/** Card payments only. The payment filter does not apply because only cards use 3-D Secure. */
export function buildTotals(slice: Slice): readonly BuildTotals[] {
  const builds = cube.builds.get(sliceKey({ ...slice, payment: 'All' }))
  if (builds === undefined) return []
  return [...builds.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([build, value]) => ({ build, submitted: value.submitted, failed3ds: value.failed3ds, days: value.dates.size }))
}

/** Percentage with one decimal, or null when the denominator is zero. */
export function share(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((1000 * numerator) / denominator) / 10 : null
}

export function difference(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null) return null
  return Math.round(10 * (current - baseline)) / 10
}

export const conversion = (totals: Totals) => share(totals.orders, totals.checkouts)
export const shippingShare = (totals: Totals) => share(totals.shipping, totals.checkouts)
export const submittedShare = (totals: Totals) => share(totals.submitted, totals.checkouts)
export const failureShare = (totals: Totals) =>
  share(totals.failed3ds + totals.failedDeclined + totals.failedGateway, totals.submitted)
export const timeoutShareOfCards = (totals: Totals) => share(totals.failed3ds, totals.cardSubmitted)
export const ordersPerDay = (totals: Totals, window: WindowKey) => Math.round(totals.orders / windows[window].days)
