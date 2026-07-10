import { WorkdayConfig } from '../types/company'
import { passesFilter, isUK, isRecent } from '../filter'
import { isNew, save } from '../store'
import { queueJob } from '../notify'

interface WorkdayJob {
  title: string
  externalPath: string
  locationsText: string
  postedOn: string
}

interface WorkdayResponse {
  total: number
  jobPostings: WorkdayJob[]
}

function baseUrl(config: WorkdayConfig): string {
  return `https://${config.tenant}.${config.subdomain}.myworkdayjobs.com`
}

function parsePostedOn(postedOn: string): string {
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
  const apiBase = `${baseUrl(config)}/wday/cxs/${config.tenant}/${config.board}/jobs`
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

      if (!isUK(job.locationsText)) { skipped++; continue }
      if (!isRecent(foundAt)) { skipped++; continue }
      if (!isNew(config.name, jobUrl)) { skipped++; continue }
      if (!passesFilter(job.title)) { save(config.name, jobUrl); skipped++; continue }

      queueJob({
        company: config.name,
        title: job.title,
        url: jobUrl,
        location: job.locationsText,
        foundAt,
      })
      save(config.name, jobUrl)
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
