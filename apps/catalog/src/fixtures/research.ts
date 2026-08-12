import type { DensityDatum, DistributionProfileDatum } from '@kevin-courbet/aperture'

export const relationshipStudy = [
  { subject: 'A01', effort: 2.1, outcome: 41, group: 'Control' },
  { subject: 'A02', effort: 3.8, outcome: 52, group: 'Control' },
  { subject: 'A03', effort: 5.4, outcome: 63, group: 'Control' },
  { subject: 'B01', effort: 2.7, outcome: 48, group: 'Trial' },
  { subject: 'B02', effort: 4.2, outcome: 66, group: 'Trial' },
  { subject: 'B03', effort: 6.1, outcome: 76, group: 'Trial' },
] as const

export const responseTimes = [118, 124, 129, 133, 137, 141, 145, 147, 151, 154, 159, 164, 172, 188] as const

export const cohortDistributions = [
  { cohort: 'New', value: 31 },
  { cohort: 'New', value: 38 },
  { cohort: 'New', value: 44 },
  { cohort: 'New', value: 52 },
  { cohort: 'Returning', value: 47 },
  { cohort: 'Returning', value: 53 },
  { cohort: 'Returning', value: 59 },
  { cohort: 'Returning', value: 68 },
] as const

const profilePositions = [28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72] as const
const profileBandwidth = 7

export const cohortDensityProfiles: readonly DistributionProfileDatum[] = ['New', 'Returning'].flatMap((cohort) => {
  const observations = cohortDistributions.filter((row) => row.cohort === cohort)
  const raw = profilePositions.map((position) => observations.reduce(
    (density, row) => density + Math.exp(-0.5 * ((position - row.value) / profileBandwidth) ** 2),
    0,
  ))
  const maximum = Math.max(...raw)
  return profilePositions.map((position, index) => ({
    id: `${cohort.toLowerCase()}-${position}`,
    category: cohort,
    position,
    density: raw[index] / maximum,
  }))
})

export const outcomeDensityStudy: readonly DensityDatum[] = [
  { id: 'control-1', x: 1.8, y: 39, series: 'Control' },
  { id: 'control-2', x: 2.2, y: 43, series: 'Control' },
  { id: 'control-3', x: 2.7, y: 45, series: 'Control' },
  { id: 'control-4', x: 3.1, y: 49, series: 'Control' },
  { id: 'control-5', x: 3.6, y: 52, series: 'Control' },
  { id: 'control-6', x: 4.0, y: 55, series: 'Control' },
  { id: 'control-7', x: 4.5, y: 58, series: 'Control' },
  { id: 'control-8', x: 4.9, y: 61, series: 'Control' },
  { id: 'trial-1', x: 2.4, y: 47, series: 'Trial' },
  { id: 'trial-2', x: 2.9, y: 51, series: 'Trial' },
  { id: 'trial-3', x: 3.4, y: 57, series: 'Trial' },
  { id: 'trial-4', x: 3.9, y: 62, series: 'Trial' },
  { id: 'trial-5', x: 4.4, y: 67, series: 'Trial' },
  { id: 'trial-6', x: 4.9, y: 70, series: 'Trial' },
  { id: 'trial-7', x: 5.4, y: 74, series: 'Trial' },
  { id: 'trial-8', x: 5.9, y: 78, series: 'Trial' },
]

export const facetedOutcomes = [
  { panel: 'Small teams', period: '2025-01-01', value: 42 },
  { panel: 'Small teams', period: '2025-04-01', value: 49 },
  { panel: 'Large teams', period: '2025-01-01', value: 61 },
  { panel: 'Large teams', period: '2025-04-01', value: 58 },
] as const

export const radarMeasures = [
  { dimension: 'Accuracy', value: 88 },
  { dimension: 'Speed', value: 72 },
  { dimension: 'Coverage', value: 81 },
  { dimension: 'Clarity', value: 91 },
  { dimension: 'Cost', value: 67 },
] as const
