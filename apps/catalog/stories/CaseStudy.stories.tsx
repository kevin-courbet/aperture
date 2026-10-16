import type { Story, StoryDefault } from '@ladle/react'
import { type CatalogParameters, withCatalogCanvas } from '../src/story'
import { CheckoutCasePage, type CheckoutCasePageProps } from './components/CheckoutCasePage'
import '../src/case-study.css'

export default {
  title: 'Demo/Checkout case study',
  decorators: [withCatalogCanvas],
  parameters: { pageStyle: 'demo' } satisfies CatalogParameters,
  meta: { description: 'A root-cause analysis page composed from Aperture widgets. The host owns the slice filters, aggregation, and headline figures.' },
} satisfies StoryDefault<CheckoutCasePageProps>

export const RootCause: Story<CheckoutCasePageProps> = (args) => <CheckoutCasePage {...args} />

export const EuMobileWebCard: Story<CheckoutCasePageProps> = (args) => <CheckoutCasePage {...args} />
EuMobileWebCard.args = { initialFilters: { region: 'EU', device: 'Mobile web', payment: 'Card' } }
