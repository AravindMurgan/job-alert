export type FilterOverride = {
  include?: string[]
  exclude?: string[]
}

export type PendingJob = {
  company: string
  title: string
  url: string
  location: string
  foundAt: string
}

type BaseConfig = {
  name: string
  enabled: boolean
  schedule: 'fast' | 'slow'
  filter?: FilterOverride
}

export type GreenhouseConfig = BaseConfig & {
  type: 'greenhouse'
  slug: string
}

export type AshbyConfig = BaseConfig & {
  type: 'ashby'
  slug: string
}

export type LeverConfig = BaseConfig & {
  type: 'lever'
  slug: string
}

export type OracleConfig = BaseConfig & {
  type: 'oracle'
  domain: string
  siteNumber: string
  keyword: string
  locationId: string
}

export type WorkdayConfig = BaseConfig & {
  type: 'workday'
  tenant: string   // e.g. "barclays"
  subdomain: string // e.g. "wd3"
  board: string    // e.g. "External_Career_Site_Barclays"
  searchTerm: string
}

export type ClinchConfig = BaseConfig & {
  type: 'clinch'
  searchUrl: string
  params: Record<string, string>
  titleSelector: string
  snippetSelector?: string
  sponsorshipBlockText?: string
  pagination: boolean
}

export type AvatureConfig = BaseConfig & {
  type: 'avature'
  searchUrl: string
  keyword: string
  sortOption: string
  locationKeywords: string[]
  idFromUrl: boolean
}

export type CustomConfig = BaseConfig & {
  type: 'custom'
  url: string
  searchSelector?: string
  searchTerm?: string
  submitSelector?: string
  resultsSelector: string
  titleSelector: string
  linkSelector: string
  locationSelector?: string
}

export type CompanyConfig =
  | GreenhouseConfig
  | AshbyConfig
  | LeverConfig
  | OracleConfig
  | WorkdayConfig
  | ClinchConfig
  | AvatureConfig
  | CustomConfig
