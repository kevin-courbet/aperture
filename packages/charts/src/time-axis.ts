import {
  fromDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type CalendarDate,
  type CalendarDateTime,
  type ZonedDateTime,
} from '@internationalized/date'

export type CalendarTickUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

export interface CalendarTickInterval {
  readonly unit: CalendarTickUnit
  readonly step: number
}

type ClockTickInterval = CalendarTickInterval & {
  readonly unit: 'millisecond' | 'second' | 'minute' | 'hour'
}

type DateTickInterval = CalendarTickInterval & {
  readonly unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export type TimeAxisOptions =
  | { readonly kind: 'automatic' }
  | { readonly kind: 'calendar'; readonly interval: CalendarTickInterval }
  | { readonly kind: 'observations' }

interface TimeAxisPlanInput {
  readonly dates: readonly Date[]
  readonly width: number
  readonly locale: string
  readonly timeZone: string
  readonly options?: TimeAxisOptions
  readonly domain?: readonly [Date, Date]
}

interface TimeAxisPlan {
  readonly domain: readonly [Date, Date]
  readonly axis: {
    readonly ticks: {
      readonly values: readonly Date[]
      readonly format: (value: Date) => string
    }
    readonly tickLabels: {
      readonly thin: {
        readonly minGap: number
        readonly priority: 'ends'
        readonly keep?: readonly Date[]
      }
      readonly fontWeight: (context: { readonly value: Date }) => number | undefined
    }
  }
}

const automaticTimeAxis: TimeAxisOptions = { kind: 'automatic' }
const maximumTickCandidates = 512
const maximumAutomaticTicks = 12
const minimumAutomaticTicks = 2
const horizontalPlotAllowance = 96
const targetTickSpacing = 80
const calendarTickUnits: readonly CalendarTickUnit[] = [
  'millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year',
]

const intervals: readonly CalendarTickInterval[] = [
  ...[1, 2, 5, 10, 20, 50, 100, 200, 500].map((step) => ({ unit: 'millisecond' as const, step })),
  ...[1, 2, 5, 10, 15, 30].map((step) => ({ unit: 'second' as const, step })),
  ...[1, 2, 5, 10, 15, 30].map((step) => ({ unit: 'minute' as const, step })),
  ...[1, 2, 3, 6, 12].map((step) => ({ unit: 'hour' as const, step })),
  ...[1, 2].map((step) => ({ unit: 'day' as const, step })),
  ...[1, 2].map((step) => ({ unit: 'week' as const, step })),
  ...[1, 2, 3, 6].map((step) => ({ unit: 'month' as const, step })),
  ...[1, 2].map((step) => ({ unit: 'quarter' as const, step })),
  ...[1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000]
    .map((step) => ({ unit: 'year' as const, step })),
]

function positiveInteger(value: number, message: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(message)
  return value
}

function validatedInterval(interval: CalendarTickInterval): CalendarTickInterval {
  if (typeof interval !== 'object' || interval === null || !calendarTickUnits.includes(interval.unit)) {
    throw new RangeError('Time-axis interval units must be supported calendar units.')
  }
  const step = positiveInteger(interval.step, 'Time-axis interval steps must be positive safe integers.')
  const clockCycle = interval.unit === 'millisecond'
    ? 1_000
    : interval.unit === 'second' || interval.unit === 'minute'
      ? 60
      : interval.unit === 'hour' ? 24 : undefined
  if (clockCycle !== undefined && clockCycle % step !== 0) {
    throw new RangeError(`Time-axis ${interval.unit} steps must divide ${clockCycle}.`)
  }
  return { unit: interval.unit, step }
}

function validatedTimeAxisOptions(options: TimeAxisOptions): TimeAxisOptions {
  if (typeof options !== 'object' || options === null || !('kind' in options)) {
    throw new RangeError('Time-axis options must select a supported policy.')
  }
  if (options.kind === 'automatic' || options.kind === 'observations') return options
  if (options.kind === 'calendar') return { kind: 'calendar', interval: validatedInterval(options.interval) }
  throw new RangeError('Time-axis options must select a supported policy.')
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function isDateInterval(interval: CalendarTickInterval): interval is DateTickInterval {
  return interval.unit === 'day'
    || interval.unit === 'week'
    || interval.unit === 'month'
    || interval.unit === 'quarter'
    || interval.unit === 'year'
}

function isClockInterval(interval: CalendarTickInterval): interval is ClockTickInterval {
  return interval.unit === 'millisecond'
    || interval.unit === 'second'
    || interval.unit === 'minute'
    || interval.unit === 'hour'
}

function floorWallInterval(value: ZonedDateTime, interval: ClockTickInterval): CalendarDateTime {
  const step = interval.step
  const wall = toCalendarDateTime(value)
  switch (interval.unit) {
    case 'millisecond':
      return wall.set({ millisecond: Math.floor(value.millisecond / step) * step })
    case 'second':
      return wall.set({ second: Math.floor(value.second / step) * step, millisecond: 0 })
    case 'minute':
      return wall.set({ minute: Math.floor(value.minute / step) * step, second: 0, millisecond: 0 })
    case 'hour':
      return wall.set({ hour: Math.floor(value.hour / step) * step, minute: 0, second: 0, millisecond: 0 })
  }
}

function floorDateInterval(
  value: CalendarDate,
  interval: DateTickInterval,
  locale: string,
): CalendarDate {
  const step = interval.step
  switch (interval.unit) {
    case 'day':
      return value.subtract({ days: mod(value.calendar.toJulianDay(value), step) })
    case 'week': {
      const week = startOfWeek(value, locale)
      const weekIndex = Math.floor(week.calendar.toJulianDay(week) / 7)
      return week.subtract({ weeks: mod(weekIndex, step) })
    }
    case 'month': {
      const month = startOfMonth(value)
      const monthIndex = month.year * 12 + month.month - 1
      return month.subtract({ months: mod(monthIndex, step) })
    }
    case 'quarter': {
      const quarterStep = step * 3
      const month = startOfMonth(value)
      const monthIndex = month.year * 12 + month.month - 1
      return month.subtract({ months: mod(monthIndex, quarterStep) })
    }
    case 'year': {
      const year = startOfYear(value)
      return year.subtract({ years: mod(year.year, step) })
    }
  }
}

function addWallUnit(value: CalendarDateTime, unit: ClockTickInterval['unit'], amount: number): CalendarDateTime {
  switch (unit) {
    case 'millisecond': return value.add({ milliseconds: amount })
    case 'second': return value.add({ seconds: amount })
    case 'minute': return value.add({ minutes: amount })
    case 'hour': return value.add({ hours: amount })
  }
}

function clockField(value: CalendarDateTime, unit: ClockTickInterval['unit']): number {
  switch (unit) {
    case 'millisecond': return value.millisecond
    case 'second': return value.second
    case 'minute': return value.minute
    case 'hour': return value.hour
  }
}

function clockCycle(unit: ClockTickInterval['unit']): number {
  return unit === 'millisecond' ? 1_000 : unit === 'hour' ? 24 : 60
}

function isClockBoundary(value: CalendarDateTime, interval: ClockTickInterval): boolean {
  if (mod(clockField(value, interval.unit), interval.step) !== 0) return false
  if (interval.unit === 'millisecond') return true
  if (value.millisecond !== 0) return false
  if (interval.unit === 'second') return true
  if (value.second !== 0) return false
  if (interval.unit === 'minute') return true
  return value.minute === 0
}

function sameWallTime(value: ZonedDateTime, wall: CalendarDateTime): boolean {
  return value.era === wall.era
    && value.year === wall.year
    && value.month === wall.month
    && value.day === wall.day
    && value.hour === wall.hour
    && value.minute === wall.minute
    && value.second === wall.second
    && value.millisecond === wall.millisecond
}

function wallTimeInstants(wall: CalendarDateTime, timeZone: string): readonly ZonedDateTime[] {
  const earlier = toZoned(wall, timeZone, 'earlier')
  const later = toZoned(wall, timeZone, 'later')
  if (!sameWallTime(earlier, wall)) return []
  return earlier.toDate().getTime() === later.toDate().getTime() || !sameWallTime(later, wall)
    ? [earlier]
    : [earlier, later]
}

function floorClockInterval(value: ZonedDateTime, interval: ClockTickInterval): ZonedDateTime {
  let wall = floorWallInterval(value, interval)
  const timestamp = value.toDate().getTime()
  for (let attempt = 0; attempt <= clockCycle(interval.unit); attempt += 1) {
    if (isClockBoundary(wall, interval)) {
      const match = wallTimeInstants(wall, value.timeZone)
        .filter((candidate) => candidate.toDate().getTime() <= timestamp)
        .at(-1)
      if (match !== undefined) return match
    }
    wall = addWallUnit(wall, interval.unit, -1)
  }
  throw new RangeError('The time-axis interval does not have a prior clock boundary.')
}

function nextClockTick(value: ZonedDateTime, interval: ClockTickInterval): ZonedDateTime {
  const timestamp = value.toDate().getTime()
  const unitMilliseconds = interval.unit === 'millisecond' ? 1
    : interval.unit === 'second' ? 1_000
      : interval.unit === 'minute' ? 60_000 : 60 * 60_000
  const searchIncrement = interval.unit === 'millisecond' ? 1
    : interval.unit === 'second' ? 1 : 1_000
  let wall = toCalendarDateTime(value)
  for (let attempt = 0; attempt <= clockCycle(interval.unit) + 2; attempt += 1) {
    wall = addWallUnit(wall, interval.unit, 1)
    let instants = wallTimeInstants(wall, value.timeZone)
    if (instants.length === 0) {
      const shifted = toCalendarDateTime(toZoned(wall, value.timeZone, 'later'))
      wall = ceilWallUnit(shifted, interval.unit)
      instants = wallTimeInstants(wall, value.timeZone)
    }
    if (!isClockBoundary(wall, interval)) continue
    const candidate = instants.find((instant) => instant.toDate().getTime() > timestamp)
    if (candidate === undefined) continue
    const candidateTimestamp = candidate.toDate().getTime()
    if (candidateTimestamp - timestamp <= unitMilliseconds * interval.step) return candidate
    for (let search = timestamp + searchIncrement; search <= candidateTimestamp; search += searchIncrement) {
      const instant = fromDate(new Date(search), value.timeZone)
      if (isClockBoundary(toCalendarDateTime(instant), interval)) return instant
    }
  }
  throw new RangeError('The time-axis interval does not have a later clock boundary.')
}

function ceilWallUnit(value: CalendarDateTime, unit: ClockTickInterval['unit']): CalendarDateTime {
  if (unit === 'millisecond') return value
  if (unit === 'second') {
    return value.millisecond === 0 ? value : value.set({ millisecond: 0 }).add({ seconds: 1 })
  }
  if (unit === 'minute') {
    return value.second === 0 && value.millisecond === 0
      ? value
      : value.set({ second: 0, millisecond: 0 }).add({ minutes: 1 })
  }
  return value.minute === 0 && value.second === 0 && value.millisecond === 0
    ? value
    : value.set({ minute: 0, second: 0, millisecond: 0 }).add({ hours: 1 })
}

function addDateInterval(value: CalendarDate, interval: DateTickInterval): CalendarDate {
  const step = interval.step
  switch (interval.unit) {
    case 'day': return value.add({ days: step })
    case 'week': return value.add({ weeks: step })
    case 'month': return value.add({ months: step })
    case 'quarter': return value.add({ months: step * 3 })
    case 'year': return value.add({ years: step })
  }
}

function subtractDateInterval(value: CalendarDate, interval: DateTickInterval): CalendarDate {
  const step = interval.step
  switch (interval.unit) {
    case 'day': return value.subtract({ days: step })
    case 'week': return value.subtract({ weeks: step })
    case 'month': return value.subtract({ months: step })
    case 'quarter': return value.subtract({ months: step * 3 })
    case 'year': return value.subtract({ years: step })
  }
}

function resolvedCalendarDate(value: CalendarDate, timeZone: string): Date | null {
  const date = value.toDate(timeZone)
  const resolved = fromDate(date, timeZone)
  return resolved.era === value.era
    && resolved.year === value.year
    && resolved.month === value.month
    && resolved.day === value.day
    ? date
    : null
}

function generateCalendarTicks(
  domain: readonly [Date, Date],
  interval: CalendarTickInterval,
  locale: string,
  timeZone: string,
): readonly Date[] | null {
  const checkedInterval = validatedInterval(interval)
  const start = domain[0].getTime()
  const end = domain[1].getTime()
  const values: Date[] = []
  let previous = Number.NEGATIVE_INFINITY

  if (isDateInterval(checkedInterval)) {
    let cursor = floorDateInterval(toCalendarDate(fromDate(domain[0], timeZone)), checkedInterval, locale)
    const initial = resolvedCalendarDate(cursor, timeZone)
    if (initial !== null && initial.getTime() < start) cursor = addDateInterval(cursor, checkedInterval)
    let attempts = 0
    while (attempts <= maximumTickCandidates + 32) {
      attempts += 1
      const date = resolvedCalendarDate(cursor, timeZone)
      if (date === null) {
        cursor = addDateInterval(cursor, checkedInterval)
        continue
      }
      const timestamp = date.getTime()
      if (timestamp > end) break
      if (timestamp <= previous) throw new RangeError('Time-axis calendar ticks must increase.')
      values.push(date)
      if (values.length > maximumTickCandidates) return null
      previous = timestamp
      cursor = addDateInterval(cursor, checkedInterval)
    }
    if (attempts > maximumTickCandidates + 32) return null
  } else if (isClockInterval(checkedInterval)) {
    let cursor = floorClockInterval(fromDate(domain[0], timeZone), checkedInterval)
    if (cursor.toDate().getTime() < start) cursor = nextClockTick(cursor, checkedInterval)
    while (cursor.toDate().getTime() <= end) {
      const date = cursor.toDate()
      const timestamp = date.getTime()
      if (timestamp <= previous) throw new RangeError('Time-axis calendar ticks must increase.')
      values.push(date)
      if (values.length > maximumTickCandidates) return null
      previous = timestamp
      cursor = nextClockTick(cursor, checkedInterval)
    }
  } else {
    throw new RangeError('Time-axis interval units must be supported calendar units.')
  }
  return values
}

function intervalDomainForObservation(
  value: Date,
  interval: CalendarTickInterval,
  locale: string,
  timeZone: string,
): readonly [Date, Date] {
  if (isDateInterval(interval)) {
    let start = floorDateInterval(toCalendarDate(fromDate(value, timeZone)), interval, locale)
    let startDate = resolvedCalendarDate(start, timeZone)
    while (startDate === null) {
      start = subtractDateInterval(start, interval)
      startDate = resolvedCalendarDate(start, timeZone)
    }
    let end = addDateInterval(start, interval)
    let endDate = resolvedCalendarDate(end, timeZone)
    while (endDate === null) {
      end = addDateInterval(end, interval)
      endDate = resolvedCalendarDate(end, timeZone)
    }
    return [startDate, endDate]
  }
  if (isClockInterval(interval)) {
    const start = floorClockInterval(fromDate(value, timeZone), interval)
    return [start.toDate(), nextClockTick(start, interval).toDate()]
  }
  throw new RangeError('Time-axis interval units must be supported calendar units.')
}

export function timeIntervalNeighbors(
  value: Date,
  interval: CalendarTickInterval,
  timeZone: string,
): readonly [Date, Date] {
  const checkedInterval = validatedInterval(interval)
  const zoned = fromDate(value, timeZone)
  let previous: Date
  let next: Date
  if (isClockInterval(checkedInterval)) {
    const milliseconds = checkedInterval.step * (
      checkedInterval.unit === 'millisecond' ? 1
        : checkedInterval.unit === 'second' ? 1_000
          : checkedInterval.unit === 'minute' ? 60_000 : 60 * 60_000
    )
    previous = new Date(value.getTime() - milliseconds)
    next = new Date(value.getTime() + milliseconds)
  } else if (isDateInterval(checkedInterval)) {
    const duration = checkedInterval.unit === 'day' ? { days: checkedInterval.step }
      : checkedInterval.unit === 'week' ? { weeks: checkedInterval.step }
        : checkedInterval.unit === 'month' ? { months: checkedInterval.step }
          : checkedInterval.unit === 'quarter' ? { months: checkedInterval.step * 3 }
            : { years: checkedInterval.step }
    previous = zoned.subtract(duration).toDate()
    next = zoned.add(duration).toDate()
  } else {
    throw new RangeError('Time-axis interval units must be supported calendar units.')
  }
  if (previous.getTime() >= value.getTime() || next.getTime() <= value.getTime()) {
    throw new RangeError('Time-axis interval neighbors must surround the date.')
  }
  return [previous, next]
}

function extent(dates: readonly Date[]): readonly [Date, Date] {
  if (dates.length === 0) throw new RangeError('Time axes require at least one date.')
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (const date of dates) {
    const timestamp = date.getTime()
    if (!Number.isFinite(timestamp)) throw new TypeError('Time axes require valid Date values.')
    minimum = Math.min(minimum, timestamp)
    maximum = Math.max(maximum, timestamp)
  }
  if (minimum === maximum) {
    return [new Date(minimum - 12 * 60 * 60 * 1000), new Date(maximum + 12 * 60 * 60 * 1000)]
  }
  return [new Date(minimum), new Date(maximum)]
}

function checkedDomain(domain: readonly [Date, Date]): readonly [Date, Date] {
  const start = domain[0].getTime()
  const end = domain[1].getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new TypeError('Time-axis domains require valid Date values.')
  if (start > end) throw new RangeError('Time-axis domains must increase.')
  return start === end ? extent(domain) : [new Date(start), new Date(end)]
}

function uniqueDates(dates: readonly Date[]): readonly Date[] {
  extent(dates)
  return [...new Set(dates.map((date) => date.getTime()))]
    .sort((left, right) => left - right)
    .map((timestamp) => new Date(timestamp))
}

function automaticTickTarget(width: number): number {
  if (!Number.isFinite(width) || width <= 0) throw new RangeError('Time-axis width must be positive and finite.')
  const available = Math.max(160, width - horizontalPlotAllowance)
  return Math.max(
    minimumAutomaticTicks,
    Math.min(maximumAutomaticTicks, Math.floor(available / targetTickSpacing)),
  )
}

function chooseAutomaticTicks(
  domain: readonly [Date, Date],
  target: number,
  locale: string,
  timeZone: string,
): { readonly interval: CalendarTickInterval; readonly values: readonly Date[] } {
  let best: { readonly interval: CalendarTickInterval; readonly values: readonly Date[]; readonly score: number } | undefined
  for (const interval of intervals) {
    const values = generateCalendarTicks(domain, interval, locale, timeZone)
    if (values === null || values.length < minimumAutomaticTicks) continue
    const overflow = Math.max(0, values.length - target)
    const score = Math.abs(values.length - target) + overflow * 3
    if (best === undefined || score < best.score) best = { interval, values, score }
    if (values.length === target) break
  }
  if (best === undefined) throw new RangeError('The time-axis domain does not support a calendar tick interval.')
  return best
}

function selectObservations(dates: readonly Date[], target: number): readonly Date[] {
  if (dates.length <= target) return dates
  return Array.from({ length: target }, (_, index) =>
    dates[Math.round(index * (dates.length - 1) / (target - 1))]!)
}

function inferredObservationInterval(values: readonly Date[], timeZone: string): CalendarTickInterval {
  const zoned = values.map((value) => fromDate(value, timeZone))
  if (values.length < 2) {
    const date = zoned[0]!
    if (date.millisecond !== 0) return { unit: 'millisecond', step: 1 }
    if (date.second !== 0) return { unit: 'second', step: 1 }
    if (date.minute !== 0 || date.hour !== 0) return { unit: 'minute', step: 1 }
    return { unit: 'day', step: 1 }
  }
  let minimumSameDay = Number.POSITIVE_INFINITY
  let minimumCalendarDays = Number.POSITIVE_INFINITY
  for (let index = 1; index < values.length; index += 1) {
    const previous = zoned[index - 1]!
    const current = zoned[index]!
    const previousDay = toCalendarDate(previous)
    const currentDay = toCalendarDate(current)
    const dayDifference = currentDay.calendar.toJulianDay(currentDay) - previousDay.calendar.toJulianDay(previousDay)
    if (dayDifference === 0) {
      minimumSameDay = Math.min(minimumSameDay, values[index]!.getTime() - values[index - 1]!.getTime())
    } else {
      minimumCalendarDays = Math.min(minimumCalendarDays, dayDifference)
    }
  }
  if (Number.isFinite(minimumSameDay)) {
    if (minimumSameDay < 1_000) return { unit: 'millisecond', step: 1 }
    if (minimumSameDay < 60_000) return { unit: 'second', step: 1 }
    if (minimumSameDay < 60 * 60_000) return { unit: 'minute', step: 1 }
    return { unit: 'hour', step: 1 }
  }
  if (minimumCalendarDays < 7) return { unit: 'day', step: 1 }
  if (minimumCalendarDays < 27) return { unit: 'week', step: 1 }
  if (minimumCalendarDays < 365) {
    return zoned.every((date) => date.day === 1) ? { unit: 'month', step: 1 } : { unit: 'day', step: 1 }
  }
  return zoned.every((date) => date.month === 1 && date.day === 1)
    ? { unit: 'year', step: 1 }
    : { unit: 'day', step: 1 }
}

function dateLabels(
  values: readonly Date[],
  interval: CalendarTickInterval,
  locale: string,
  timeZone: string,
  standalone: boolean,
): {
  readonly labels: ReadonlyMap<number, string>
  readonly contextBoundaries: readonly Date[]
  readonly yearBoundaries: ReadonlySet<number>
} {
  const zoned = values.map((value) => fromDate(value, timeZone))
  const year = new Intl.DateTimeFormat(locale, { calendar: 'gregory', year: 'numeric', timeZone })
  const month = new Intl.DateTimeFormat(locale, { calendar: 'gregory', month: 'short', timeZone })
  const monthYear = new Intl.DateTimeFormat(locale, { calendar: 'gregory', month: 'short', year: 'numeric', timeZone })
  const day = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', timeZone })
  const dayMonth = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', timeZone })
  const dayMonthYear = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric', timeZone })
  const time = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', timeZone })
  const timeSecond = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone })
  const timeMillisecond = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZone })
  const dateTime = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone })
  const dateTimeYearZone = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone, timeZoneName: 'short' })
  const timeZoneTime = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', timeZone, timeZoneName: 'short' })
  const dateTimeSecondYearZone = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone, timeZoneName: 'short' })
  const timeZoneSecond = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone, timeZoneName: 'short' })
  const dateTimeMillisecondYearZone = new Intl.DateTimeFormat(locale, { calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZone, timeZoneName: 'short' })
  const timeZoneMillisecond = new Intl.DateTimeFormat(locale, { calendar: 'gregory', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, timeZone, timeZoneName: 'short' })
  const labels = new Map<number, string>()
  const labelContexts = new Map<number, string>()
  const contextBoundaries: Date[] = []
  const yearBoundaries = new Set<number>()

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]!
    const current = zoned[index]!
    const previous = zoned[index - 1]
    const next = zoned[index + 1]
    const first = previous === undefined
    const yearChanged = first || previous.year !== current.year
    const monthChanged = first || yearChanged || previous.month !== current.month
    const dayChanged = first || monthChanged || previous.day !== current.day
    const nearOffsetChange = previous?.offset !== current.offset || next?.offset !== current.offset
    if (yearChanged) yearBoundaries.add(value.getTime())

    const contextChanged = interval.unit === 'quarter' || interval.unit === 'month' || interval.unit === 'week'
      ? yearChanged
      : interval.unit === 'day'
        ? monthChanged
        : interval.unit === 'year' ? false : dayChanged
    if (!first && contextChanged) contextBoundaries.push(value)

    let label: string
    switch (interval.unit) {
      case 'year':
        label = year.format(value)
        break
      case 'quarter': {
        label = standalone || yearChanged ? monthYear.format(value) : month.format(value)
        break
      }
      case 'month':
        label = standalone || yearChanged ? monthYear.format(value) : month.format(value)
        break
      case 'week':
        label = standalone || yearChanged ? dayMonthYear.format(value) : dayMonth.format(value)
        break
      case 'day':
        label = standalone || yearChanged
          ? dayMonthYear.format(value)
          : monthChanged ? dayMonth.format(value) : day.format(value)
        break
      case 'hour':
      case 'minute':
        label = standalone || first || yearChanged
          ? dateTimeYearZone.format(value)
          : dayChanged ? dateTime.format(value) : nearOffsetChange ? timeZoneTime.format(value) : time.format(value)
        break
      case 'second':
        label = standalone || first || dayChanged
          ? dateTimeSecondYearZone.format(value)
          : nearOffsetChange ? timeZoneSecond.format(value) : timeSecond.format(value)
        break
      case 'millisecond':
        label = standalone || first || dayChanged
          ? dateTimeMillisecondYearZone.format(value)
          : nearOffsetChange ? timeZoneMillisecond.format(value) : timeMillisecond.format(value)
        break
    }
    labels.set(value.getTime(), label)
    const context = interval.unit === 'quarter' || interval.unit === 'month' || interval.unit === 'week'
      ? String(current.year)
      : interval.unit === 'day'
        ? `${current.year}-${current.month}`
        : interval.unit === 'year' ? '' : `${current.year}-${current.month}-${current.day}`
    labelContexts.set(value.getTime(), context)
  }

  const duplicates = new Map<string, Date[]>()
  for (const value of values) {
    const timestamp = value.getTime()
    const key = `${labelContexts.get(timestamp)}\u0000${labels.get(timestamp)}`
    const matches = duplicates.get(key)
    if (matches === undefined) duplicates.set(key, [value])
    else matches.push(value)
  }
  const precise = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    second: '2-digit', fractionalSecondDigits: 3, timeZone, timeZoneName: 'short',
  })
  for (const matches of duplicates.values()) {
    if (matches.length < 2) continue
    for (const value of matches) labels.set(value.getTime(), precise.format(value))
  }
  return { labels, contextBoundaries, yearBoundaries }
}

export function planTimeAxis({
  dates,
  width,
  locale,
  timeZone,
  options = automaticTimeAxis,
  domain: suppliedDomain,
}: TimeAxisPlanInput): TimeAxisPlan {
  const observations = uniqueDates(dates)
  let domain = suppliedDomain === undefined ? extent(observations) : checkedDomain(suppliedDomain)
  const target = automaticTickTarget(width)
  const validatedOptions = validatedTimeAxisOptions(options)
  if (observations.length === 1 && validatedOptions.kind === 'calendar') {
    const intervalDomain = intervalDomainForObservation(observations[0]!, validatedOptions.interval, locale, timeZone)
    domain = [
      new Date(Math.min(domain[0].getTime(), intervalDomain[0].getTime())),
      new Date(Math.max(domain[1].getTime(), intervalDomain[1].getTime())),
    ]
  }
  const domainObservations = observations.filter((value) => {
    const timestamp = value.getTime()
    return timestamp >= domain[0].getTime() && timestamp <= domain[1].getTime()
  })
  if (domainObservations.length === 0) throw new RangeError('Time axes require an observation inside the domain.')

  let interval: CalendarTickInterval
  let values: readonly Date[]
  if (validatedOptions.kind === 'observations' || (validatedOptions.kind === 'automatic' && observations.length === 1)) {
    interval = inferredObservationInterval(domainObservations, timeZone)
    values = selectObservations(domainObservations, target)
  } else if (validatedOptions.kind === 'calendar') {
    interval = validatedOptions.interval
    const generated = generateCalendarTicks(domain, interval, locale, timeZone)
    if (generated === null) throw new RangeError(`The requested time-axis interval exceeds ${maximumTickCandidates} ticks.`)
    if (generated.length === 0) throw new RangeError('The requested time-axis interval does not produce a tick inside the domain.')
    values = generated
  } else {
    const automatic = chooseAutomaticTicks(domain, target, locale, timeZone)
    interval = automatic.interval
    values = automatic.values
  }

  const standalone = values.length > target
  const { labels, contextBoundaries, yearBoundaries } = dateLabels(values, interval, locale, timeZone, standalone)
  return {
    domain,
    axis: {
      ticks: {
        values,
        format: (value) => labels.get(value.getTime()) ?? '',
      },
      tickLabels: {
        thin: {
          minGap: 8,
          priority: 'ends',
          ...(standalone || contextBoundaries.length === 0 ? {} : { keep: contextBoundaries }),
        },
        fontWeight: ({ value }) => yearBoundaries.has(value.getTime()) ? 650 : undefined,
      },
    },
  }
}
