import { CompanyConfig } from '../src/types/company'

export const companies: CompanyConfig[] = [
  // ── Greenhouse (RSS) ──────────────────────────────────────────────────────
  { type: 'greenhouse', name: 'Monzo',       slug: 'monzo',       enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'GoCardless',  slug: 'gocardless',  enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'Deliveroo',   slug: 'deliveroo',   enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'Starling Bank', slug: 'starlingbank', enabled: true, schedule: 'fast' },
  { type: 'greenhouse', name: 'Babylon Health', slug: 'babylonhealth', enabled: true, schedule: 'fast' },

  // ── Ashby (RSS) ───────────────────────────────────────────────────────────
  { type: 'ashby', name: 'Checkout.com', slug: 'checkout.com',  enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'ClearBank',    slug: 'clearbank',     enabled: true, schedule: 'fast' },
  { type: 'ashby', name: 'Wayve',        slug: 'wayve',         enabled: true, schedule: 'fast' },

  // ── Lever (JSON API) ──────────────────────────────────────────────────────
  { type: 'lever', name: 'Revolut',  slug: 'revolut',  enabled: true, schedule: 'fast' },
  { type: 'lever', name: 'Marshmallow', slug: 'marshmallow', enabled: true, schedule: 'fast' },

  // ── Workday (REST API) ────────────────────────────────────────────────────
  {
    type: 'workday', name: 'Barclays', schedule: 'slow', enabled: true,
    tenant: 'barclays', subdomain: 'wd3', board: 'External_Career_Site_Barclays',
    searchTerm: 'software engineer',
  },

  // ── Oracle HCM (REST API) ─────────────────────────────────────────────────
  {
    type: 'oracle', name: 'JP Morgan', schedule: 'fast', enabled: true,
    domain: 'jpmc.fa.oraclecloud.com', siteNumber: 'CX_1014',
    keyword: 'software engineer', locationId: '300000000149325',
  },

  // ── Avature (browser) ─────────────────────────────────────────────────────
  {
    type: 'avature', name: 'Tesco', schedule: 'slow', enabled: true,
    searchUrl: 'https://www.tesco-careers.com/search/',
    keyword: 'software engineer', sortOption: 'Recently Added',
    locationKeywords: ['london', 'uk', 'united kingdom', 'england'],
    idFromUrl: true,
  },
]
