import { CompanyConfig } from '../src/types/company'

export const companies: CompanyConfig[] = [
  // ── Greenhouse ────────────────────────────────────────────────────────────
  { type: 'greenhouse', name: 'Monzo',      slug: 'monzo',      enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'GoCardless', slug: 'gocardless', enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'Cleo',       slug: 'cleo',       enabled: true, schedule: 'fast' },

  // ── Ashby ─────────────────────────────────────────────────────────────────
  { type: 'ashby', name: 'Checkout.com', slug: 'checkout.com', enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'ClearBank',    slug: 'clearbank',    enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'Wayve',        slug: 'wayve',        enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'Deliveroo',    slug: 'deliveroo',    enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'Marshmallow',  slug: 'marshmallow',  enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'OakNorth',     slug: 'oaknorth',     enabled: true, schedule: 'fast' },

  // ── Workday (REST API) ────────────────────────────────────────────────────
  {
    type: 'workday', name: 'Barclays', schedule: 'fast', enabled: true,
    tenant: 'barclays', subdomain: 'wd3', board: 'External_Career_Site_Barclays',
    searchTerm: 'software engineer',
  },

  // ── Oracle HCM (REST API) ─────────────────────────────────────────────────
  {
    type: 'oracle', name: 'JP Morgan', schedule: 'fast', enabled: true,
    domain: 'jpmc.fa.oraclecloud.com', siteNumber: 'CX_1014',
    keyword: 'software engineer', locationId: '300000000149325',
  },
]
