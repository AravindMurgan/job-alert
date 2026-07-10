import { OracleConfig } from '../types/company'
import { passesFilter, isRecent } from '../filter'
import { isNew, save, getLastSeenId, saveLastSeenId } from '../store'
import { queueJob } from '../notify'

interface OracleJob {
  Id: string
  Title: string
  PrimaryLocation: string
  PrimaryLocationCountry: string
  PostedDate: string
}

interface OracleResponse {
  items: Array<{ requisitionList: OracleJob[] }>
  hasMore?: boolean
}

function jobUrl(config: OracleConfig, id: string): string {
  return `https://${config.domain}/hcmUI/CandidateExperience/en/sites/${config.siteNumber}/job/${id}`
}

export async function scrapeOracle(config: OracleConfig): Promise<void> {
  const lastSeenId = getLastSeenId(config.name)
  let maxId = lastSeenId
  let offset = 0
  const limit = 25
  const maxPages = 5
  let page = 0
  let queued = 0, skipped = 0

  while (true) {
    const finderParts = [`siteNumber=${config.siteNumber}`, `keyword=${config.keyword}`]
    if (config.locationId) finderParts.push(`locationId=${config.locationId}`)
    const params = new URLSearchParams({
      expand: 'requisitionList.secondaryLocations',
      finder: `findReqs;${finderParts.join(',')}`,
      limit: String(limit),
      offset: String(offset),
    })

    const url = `https://${config.domain}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?${params}`
    const res = await fetch(url)
    if (!res.ok) { console.error(`[oracle] ${config.name} — HTTP ${res.status}`); break }

    const data = await res.json() as OracleResponse
    const jobs: OracleJob[] = data.items?.[0]?.requisitionList ?? []
    if (jobs.length === 0) break

    for (const job of jobs) {
      const id = job.Id
      const numericId = parseInt(id, 10)
      const foundAt = job.PostedDate ? new Date(job.PostedDate).toISOString() : new Date().toISOString()

      // Skip non-UK roles
      if (job.PrimaryLocationCountry !== 'GB') { skipped++; continue }

      // Skip already-seen IDs
      if (!isNew(config.name, id)) { skipped++; continue }

      // Track highest ID seen this run
      if (numericId > maxId) maxId = numericId

      if (!isRecent(foundAt)) { skipped++; continue }

      if (!passesFilter(job.Title)) { save(config.name, id); skipped++; continue }

      queueJob({
        company: config.name,
        title: job.Title,
        url: jobUrl(config, id),
        location: job.PrimaryLocation,
        foundAt,
      })
      save(config.name, id)
      queued++
    }

    // Stop if we've reached jobs older than last seen
    const oldestOnPage = parseInt(jobs[jobs.length - 1].Id, 10)
    if (oldestOnPage <= lastSeenId) break

    if (jobs.length < limit) break
    page++
    if (page >= maxPages) break
    offset += limit
  }

  if (maxId > lastSeenId) saveLastSeenId(config.name, maxId)
  console.log(`[oracle] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Standalone test run ───────────────────────────────────────────────────────

if (require.main === module) {
  const config: OracleConfig = {
    type: 'oracle', name: 'JP Morgan', schedule: 'fast', enabled: true,
    domain: 'jpmc.fa.oraclecloud.com', siteNumber: 'CX_1014',
    keyword: 'software engineer', locationId: '300000000149325',
  };

  (async () => {
    await scrapeOracle(config)
    console.log('[done] check data/pending.json')
  })().catch(err => { console.error('[oracle] Fatal:', err.message); process.exit(1) })
}
