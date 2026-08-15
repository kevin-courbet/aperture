import type { NumericPoint } from './types.js'

export function finite(value: number, message: string): number {
  if (!Number.isFinite(value)) throw new TypeError(message)
  return value
}

export function validDate(value: Date, message: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError(message)
  }
  return value
}

export function positiveHeight(value: number, message: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(message)
  return value
}

export function positiveWidth(value: number, message: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(message)
  return value
}

export function numericPoint(value: NumericPoint, message: string): number | null {
  return value.kind === 'missing' ? null : finite(value.value, message)
}

export function bounded(value: number, minimum: number, maximum: number, message: string): number {
  finite(value, message)
  if (value < minimum || value > maximum) {
    throw new RangeError(`${message} Expected a value from ${minimum} to ${maximum}.`)
  }
  return value
}

export function positiveRadius(value: number, family: string): number {
  finite(value, `${family} radius must be finite.`)
  if (value <= 0) throw new RangeError(`${family} radius must be greater than 0.`)
  return value
}

export function increasingDomain(domain: readonly [number, number], family: string): readonly [number, number] {
  finite(domain[0], `${family} domain values must be finite.`)
  finite(domain[1], `${family} domain values must be finite.`)
  if (domain[0] >= domain[1]) throw new RangeError(`${family} domain minimum must be less than its maximum.`)
  return domain
}

export function validHistogramBin(start: number, end: number, count: number) {
  finite(start, 'Histogram bin bounds must be finite.')
  finite(end, 'Histogram bin bounds must be finite.')
  finite(count, 'Histogram bin count must be finite.')
  if (start >= end) throw new RangeError('Histogram bin start must be less than its end.')
  if (count < 0) throw new RangeError('Histogram bin count must be 0 or greater.')
}

export function validRange(low: number, high: number, family: string) {
  finite(low, `${family} values must be finite.`)
  finite(high, `${family} values must be finite.`)
  if (low > high) throw new RangeError(`${family} low value must not be greater than its high value.`)
}

export function validErrorInterval(low: number, estimate: number, high: number) {
  validRange(low, high, 'Error bar')
  finite(estimate, 'Error bar estimate must be finite.')
  if (estimate < low || estimate > high) {
    throw new RangeError('Error bar estimate must be between its low and high values.')
  }
}

export function validCandlestick(low: number, open: number, close: number, high: number) {
  validRange(low, high, 'Candlestick')
  finite(open, 'Candlestick open value must be finite.')
  finite(close, 'Candlestick close value must be finite.')
  if (open < low || open > high || close < low || close > high) {
    throw new RangeError('Candlestick open and close values must be between its low and high values.')
  }
}

export function validDonutValues(values: readonly number[]) {
  let total = 0
  for (const value of values) {
    finite(value, 'Donut values must be finite.')
    if (value < 0) throw new RangeError('Donut values must be 0 or greater.')
    total += value
  }
  if (total <= 0) throw new RangeError('Donut values must have a positive total.')
}
