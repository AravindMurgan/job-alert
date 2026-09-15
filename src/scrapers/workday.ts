import { WorkdayConfig } from '../types/company'
import { passesFilter, isUK, isRecent } from '../filter'
import { isNew } from '../store'
import { queueJob } from '../notify'

interface WorkdayJob {
  title: string
  externalPath: string
  locationsText: string
  postedOn?: string
}

interface WorkdayResponse {
  total: number
  jobPostings: WorkdayJob[]
}

interface WorkdayJobDetail {
  jobPostingInfo?: {
    jobRequisitionLocation?: { country?: { alpha2Code?: string } }
    country?: { alpha2Code?: string }
  }
}

const MULTI_LOCATION_PLACEHOLDER = /^\d+\s+locations?$/i

function baseUrl(config: WorkdayConfig): string {
  return `https://${config.tenant}.${config.subdomain}.myworkdayjobs.com`
}

// Workday's search-results endpoint collapses multi-location postings into
// an unusable "N Locations" placeholder with no city/country info at all.
// For just that ambiguous subset, fetch the job's own detail endpoint,
// which returns a structured country code — a much smaller cost than doing
// this for every posting.
async function isMultiLocationUK(config: WorkdayConfig, externalPath: string): Promise<boolean> {
  const detailUrl = `${baseUrl(config)}/wday/cxs/${config.apiTenant ?? config.tenant}/${config.board}${externalPath}`
  const res = await fetch(detailUrl)
  if (!res.ok) return false
  const data = await res.json() as WorkdayJobDetail
  const alpha2 = data.jobPostingInfo?.jobRequisitionLocation?.country?.alpha2Code
    ?? data.jobPostingInfo?.country?.alpha2Code
  return alpha2 === 'GB'
}

function parsePostedOn(postedOn: string | undefined): string {
  if (!postedOn) return new Date().toISOString()
  const now = new Date()
  const lower = postedOn.toLowerCase()
  if (lower.includes('today')) return now.toISOString()
  const daysMatch = lower.match(/(\d+)\+?\s+day/)
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10)
    now.setDate(now.getDate() - days)
    return now.toISOString()
  }
  return new Date().toISOString()
}

export async function scrapeWorkday(config: WorkdayConfig): Promise<void> {
  const apiBase = `${baseUrl(config)}/wday/cxs/${config.apiTenant ?? config.tenant}/${config.board}/jobs`
  const jobBase = `${baseUrl(config)}/${config.board}`

  let offset = 0
  const limit = 20
  let queued = 0, skipped = 0

  while (true) {
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, offset, searchText: config.searchTerm, appliedFacets: {} }),
    })

    if (!res.ok) { console.error(`[workday] ${config.name} — HTTP ${res.status}`); break }

    const data = await res.json() as WorkdayResponse
    const jobs = data.jobPostings ?? []
    if (jobs.length === 0) break

    for (const job of jobs) {
      const jobUrl = `${jobBase}${job.externalPath}`
      const foundAt = parsePostedOn(job.postedOn)

      if (!isUK(job.locationsText)) {
        const ambiguous = MULTI_LOCATION_PLACEHOLDER.test(job.locationsText)
        if (!ambiguous || !(await isMultiLocationUK(config, job.externalPath))) { skipped++; continue }
      }
      if (!isRecent(foundAt)) { skipped++; continue }
      if (!isNew(config.name, jobUrl)) { skipped++; continue }
      if (!passesFilter(job.title)) { skipped++; continue }

      queueJob({
        company: config.name,
        title: job.title,
        url: jobUrl,
        location: job.locationsText,
        foundAt,
      })
      queued++
    }

    if (offset + limit >= data.total) break
    offset += limit
  }

  console.log(`[workday] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Standalone test run ───────────────────────────────────────────────────────

if (require.main === module) {
  const config: WorkdayConfig = {
    type: 'workday', name: 'Barclays', schedule: 'slow', enabled: true,
    tenant: 'barclays', subdomain: 'wd3', board: 'External_Career_Site_Barclays',
    searchTerm: 'software engineer',
  };

  (async () => {
    await scrapeWorkday(config)
    console.log('[done] check data/pending.json')
  })().catch(err => { console.error('[workday] Fatal:', err.message); process.exit(1) })
}
