import type { ChoroplethDatum, RouteDatum } from '@kevin-courbet/aperture'

export const schematicRegions: readonly ChoroplethDatum[] = [
  { type: 'Feature', properties: { id: 'north-west', label: 'North-west region', value: { kind: 'value', value: 71 } }, geometry: { type: 'Polygon', coordinates: [[[0, 12], [9, 12], [9, 22], [0, 22], [0, 12]]] } },
  { type: 'Feature', properties: { id: 'north-east', label: 'North-east region', value: { kind: 'value', value: 64 } }, geometry: { type: 'Polygon', coordinates: [[[10, 12], [22, 12], [22, 22], [10, 22], [10, 12]]] } },
  { type: 'Feature', properties: { id: 'south-west', label: 'South-west region', value: { kind: 'value', value: 77 } }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [9, 0], [9, 11], [0, 11], [0, 0]]] } },
  { type: 'Feature', properties: { id: 'south-east', label: 'South-east region', value: { kind: 'value', value: 53 } }, geometry: { type: 'Polygon', coordinates: [[[10, 0], [22, 0], [22, 11], [10, 11], [10, 0]]] } },
]

export const deliveryRoute = [
  { stop: 'Glasgow', latitude: 55.8642, longitude: -4.2518, sequence: 1 },
  { stop: 'Manchester', latitude: 53.4808, longitude: -2.2426, sequence: 2 },
  { stop: 'Birmingham', latitude: 52.4862, longitude: -1.8904, sequence: 3 },
  { stop: 'London', latitude: 51.5072, longitude: -0.1276, sequence: 4 },
] as const

export const deliveryRouteFeature: RouteDatum = {
  type: 'Feature',
  properties: { id: 'north-south', label: 'Glasgow to London' },
  geometry: {
    type: 'LineString',
    coordinates: deliveryRoute.map((stop): [number, number] => [stop.longitude, stop.latitude]),
  },
}
