import { GreenhouseConfig, AshbyConfig, LeverConfig } from '../types/company'
import { passesFilter, isUK, isRecent } from '../filter'
import { isNew, save } from '../store'
import { queueJob } from '../notify'

type RssConfig = GreenhouseConfig | AshbyConfig | LeverConfig

// ── Greenhouse JSON API ───────────────────────────────────────────────────────

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  first_published: string | null
  updated_at: string | null
}

async function scrapeGreenhouse(config: GreenhouseConfig): Promise<void> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${config.slug}/jobs`
  const res = await fetch(url)
  if (!res.ok) { console.error(`[rss] ${config.name} — HTTP ${res.status}`); return }

  const data = await res.json() as { jobs: GreenhouseJob[] }
  let queued = 0, skipped = 0

  for (const job of data.jobs) {
    const id = String(job.id)
    const location = job.location?.name ?? ''
    const foundAt = job.first_published ?? job.updated_at ?? new Date().toISOString()

    if (!isUK(location)) { skipped++; continue }
    if (!isRecent(foundAt)) { skipped++; continue }
    if (!isNew(config.name, id)) { skipped++; continue }
    if (!passesFilter(job.title)) { save(config.name, id); skipped++; continue }

    queueJob({ company: config.name, title: job.title, url: job.absolute_url, location, foundAt })
    save(config.name, id)
    queued++
  }

  console.log(`[rss] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Ashby JSON API ────────────────────────────────────────────────────────────

interface AshbyJob {
  id: string
  title: string
  location: string
  isListed: boolean
  publishedAt: string | null
}

async function scrapeAshby(config: AshbyConfig): Promise<void> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${config.slug}`
  const res = await fetch(url)
  if (!res.ok) { console.error(`[rss] ${config.name} — HTTP ${res.status}`); return }

  const data = await res.json() as { jobs: AshbyJob[] }
  let queued = 0, skipped = 0

  for (const job of data.jobs) {
    if (!job.isListed) { skipped++; continue }

    const id = job.id
    const location = job.location ?? ''
    const jobUrl = `https://jobs.ashbyhq.com/${config.slug}/${id}`
    const foundAt = job.publishedAt ?? new Date().toISOString()

    if (!isUK(location)) { skipped++; continue }
    if (!isRecent(foundAt)) { skipped++; continue }
    if (!isNew(config.name, id)) { skipped++; continue }
    if (!passesFilter(job.title)) { save(config.name, id); skipped++; continue }

    queueJob({ company: config.name, title: job.title, url: jobUrl, location, foundAt })
    save(config.name, id)
    queued++
  }

  console.log(`[rss] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Lever JSON API ────────────────────────────────────────────────────────────

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  createdAt: number   // Unix ms
  categories: { location?: string }
}

async function scrapeLever(config: LeverConfig): Promise<void> {
  const url = `https://api.lever.co/v0/postings/${config.slug}?mode=json`
  const res = await fetch(url)
  if (!res.ok) { console.error(`[rss] ${config.name} — HTTP ${res.status}`); return }

  const postings = await res.json() as LeverPosting[]
  let queued = 0, skipped = 0

  for (const p of postings) {
    const id = p.id
    const location = p.categories?.location ?? ''
    const foundAt = p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()

    if (!isUK(location)) { skipped++; continue }
    if (!isRecent(foundAt)) { skipped++; continue }
    if (!isNew(config.name, id)) { skipped++; continue }
    if (!passesFilter(p.text)) { save(config.name, id); skipped++; continue }

    queueJob({ company: config.name, title: p.text, url: p.hostedUrl, location, foundAt })
    save(config.name, id)
    queued++
  }

  console.log(`[rss] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeRss(config: RssConfig): Promise<void> {
  if (config.type === 'greenhouse') await scrapeGreenhouse(config)
  else if (config.type === 'ashby') await scrapeAshby(config)
  else await scrapeLever(config)
}

// ── Standalone test run ───────────────────────────────────────────────────────

if (require.main === module) {
  const testConfigs: RssConfig[] = [
    { type: 'greenhouse', name: 'Monzo',        slug: 'monzo',        enabled: true, schedule: 'fast' },
    { type: 'greenhouse', name: 'GoCardless',   slug: 'gocardless',   enabled: true, schedule: 'fast' },
    { type: 'ashby',      name: 'Checkout.com', slug: 'checkout.com', enabled: true, schedule: 'fast' },
    { type: 'lever',      name: 'Lever Test',   slug: 'lever',        enabled: true, schedule: 'fast' },
  ];

  (async () => {
    for (const c of testConfigs) await scrapeRss(c)
    console.log('\n[done] check data/pending.json')
  })().catch(err => { console.error('[rss] Fatal:', err.message); process.exit(1) })
}
