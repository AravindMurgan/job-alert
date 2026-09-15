import { WorkableConfig } from '../types/company'
import { passesFilter, isRecent } from '../filter'
import { isNew } from '../store'
import { queueJob } from '../notify'

interface WorkableJob {
  shortcode: string
  title: string
  location: { country: string; countryCode: string; city: string; region: string }
  published: string
}

interface WorkableResponse {
  total: number
  results: WorkableJob[]
}

export async function scrapeWorkable(config: WorkableConfig): Promise<void> {
  const url = `https://apply.workable.com/api/v3/accounts/${config.slug}/jobs`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (!res.ok) { console.error(`[workable] ${config.name} — HTTP ${res.status}`); return }

  const data = await res.json() as WorkableResponse
  let queued = 0, skipped = 0

  for (const job of data.results) {
    const jobUrl = `https://apply.workable.com/${config.slug}/j/${job.shortcode}/`
    const foundAt = job.published ?? new Date().toISOString()

    if (job.location?.countryCode !== 'GB') { skipped++; continue }
    if (!isRecent(foundAt)) { skipped++; continue }
    if (!isNew(config.name, jobUrl)) { skipped++; continue }
    if (!passesFilter(job.title)) { skipped++; continue }

    queueJob({ company: config.name, title: job.title, url: jobUrl, location: job.location.city, foundAt })
    queued++
  }

  console.log(`[workable] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Standalone test run ───────────────────────────────────────────────────────

if (require.main === module) {
  const config: WorkableConfig = {
    type: 'workable', name: 'Starling Bank', schedule: 'fast', enabled: true,
    slug: 'starling-bank',
  };

  (async () => {
    await scrapeWorkable(config)
    console.log('[done] check data/pending.json')
  })().catch(err => { console.error('[workable] Fatal:', err.message); process.exit(1) })
}
