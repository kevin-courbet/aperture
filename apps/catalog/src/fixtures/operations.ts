export const throughputByMonth = [
  { period: '2025-01-01', completed: 42, queued: 18, goal: 55 },
  { period: '2025-02-01', completed: 48, queued: 21, goal: 55 },
  { period: '2025-03-01', completed: 45, queued: 16, goal: 55 },
  { period: '2025-04-01', completed: 57, queued: 14, goal: 55 },
  { period: '2025-05-01', completed: 61, queued: 12, goal: 55 },
  { period: '2025-06-01', completed: 58, queued: 15, goal: 55 },
] as const

export const channelVolume = [
  { category: 'Direct', value: 184, previous: 172 },
  { category: 'Partner', value: 132, previous: 145 },
  { category: 'Referral', value: 96, previous: 82 },
  { category: 'Field', value: 71, previous: 68 },
] as const

export const serviceMatrix = [
  { row: 'Search', column: 'Mon', value: 82 },
  { row: 'Search', column: 'Tue', value: 74 },
  { row: 'Search', column: 'Wed', value: 91 },
  { row: 'Billing', column: 'Mon', value: 63 },
  { row: 'Billing', column: 'Tue', value: 58 },
  { row: 'Billing', column: 'Wed', value: 67 },
  { row: 'Export', column: 'Mon', value: 39 },
  { row: 'Export', column: 'Tue', value: 47 },
  { row: 'Export', column: 'Wed', value: 44 },
] as const

export const deliveryIntervals = [
  { category: 'North', low: 3.2, value: 4.1, high: 5.4 },
  { category: 'Central', low: 2.8, value: 3.7, high: 4.9 },
  { category: 'South', low: 4.4, value: 5.2, high: 6.7 },
] as const

export const compositionByMonth = [
  { period: '2025-01-01', planned: 31, reactive: 15, research: 9 },
  { period: '2025-02-01', planned: 34, reactive: 13, research: 11 },
  { period: '2025-03-01', planned: 38, reactive: 12, research: 10 },
  { period: '2025-04-01', planned: 40, reactive: 14, research: 12 },
] as const
