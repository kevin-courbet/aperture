export const cashMovement = [
  { id: 'opening', label: 'Opening cash', delta: 240 },
  { id: 'receipts', label: 'Receipts', delta: 86 },
  { id: 'payroll', label: 'Payroll', delta: -54 },
  { id: 'services', label: 'Services', delta: -21 },
] as const

export const closingCash = cashMovement.reduce((total, row) => total + row.delta, 0)

export const marketSeries = [
  { period: '2025-06-02', open: 104, high: 109, low: 102, close: 108, volume: 1820 },
  { period: '2025-06-03', open: 108, high: 111, low: 105, close: 106, volume: 1640 },
  { period: '2025-06-04', open: 106, high: 114, low: 106, close: 112, volume: 2310 },
  { period: '2025-06-05', open: 112, high: 115, low: 108, close: 110, volume: 1940 },
  { period: '2025-06-06', open: 110, high: 118, low: 109, close: 117, volume: 2670 },
] as const

export const allocation = [
  { category: 'Delivery', value: 46 },
  { category: 'Research', value: 24 },
  { category: 'Support', value: 18 },
  { category: 'Reserve', value: 12 },
] as const
