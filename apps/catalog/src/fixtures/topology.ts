import type { HierarchyDatum, NetworkData, SankeyData } from '@kevin-courbet/aperture'

export const hierarchyNodes: readonly HierarchyDatum[] = [
  { id: 'portfolio', parentId: null, label: 'Portfolio', value: null },
  { id: 'products', parentId: 'portfolio', label: 'Products', value: null },
  { id: 'core', parentId: 'products', label: 'Core', value: 30 },
  { id: 'labs', parentId: 'products', label: 'Labs', value: 18 },
  { id: 'services', parentId: 'portfolio', label: 'Services', value: null },
  { id: 'advisory', parentId: 'services', label: 'Advisory', value: 19 },
  { id: 'support', parentId: 'services', label: 'Support', value: 13 },
  { id: 'operations', parentId: 'portfolio', label: 'Operations', value: 20 },
]

export const flow = {
  nodes: [
    { id: 'Visits', label: 'Visits' },
    { id: 'Trials', label: 'Trials' },
    { id: 'Paid', label: 'Paid' },
    { id: 'Exit', label: 'Exit' },
  ],
  links: [
    { id: 'visits-trials', source: 'Visits', target: 'Trials', value: 64 },
    { id: 'visits-exit', source: 'Visits', target: 'Exit', value: 36 },
    { id: 'trials-paid', source: 'Trials', target: 'Paid', value: 27 },
    { id: 'trials-exit', source: 'Trials', target: 'Exit', value: 37 },
  ],
} as const satisfies SankeyData

export const network = {
  nodes: [
    { id: 'Gateway', label: 'Gateway', group: 'Edge' },
    { id: 'Search', label: 'Search', group: 'Service' },
    { id: 'Billing', label: 'Billing', group: 'Service' },
    { id: 'Store', label: 'Store', group: 'Data' },
  ],
  links: [
    { id: 'gateway-search', source: 'Gateway', target: 'Search', weight: 0.82 },
    { id: 'gateway-billing', source: 'Gateway', target: 'Billing', weight: 0.51 },
    { id: 'search-store', source: 'Search', target: 'Store', weight: 0.69 },
    { id: 'billing-store', source: 'Billing', target: 'Store', weight: 0.44 },
  ],
} as const satisfies NetworkData
