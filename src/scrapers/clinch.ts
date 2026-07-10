import { chromium } from 'playwright'
import { ClinchConfig } from '../types/company'
import { passesFilter, isUK } from '../filter'
import { isNew, save } from '../store'
import { queueJob } from '../notify'

const CARD_SELECTOR = '.job-search-results-card'
const LOCATION_SELECTOR = '.job-component-location span'
const NEXT_PAGE_SELECTOR = '.next.next_page:not(.disabled) a[rel="next"]'

export async function scrapeClinch(config: ClinchConfig): Promise<void> {
  const browser = await chromium.launch()
  let queued = 0, skipped = 0

  try {
    const page = await browser.newPage()
    const url = new URL(config.searchUrl)
    for (const [key, value] of Object.entries(config.params)) {
      url.searchParams.append(key, value)
    }

    let pageNum = 1
    let hasMore = true

    while (hasMore) {
      url.searchParams.set('page', String(pageNum))
      await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 30000 })

      const cards = await page.locator(CARD_SELECTOR).all()

      for (const card of cards) {
        const titleEl = card.locator(config.titleSelector).first()
        const title = (await titleEl.textContent())?.trim() ?? ''
        const href = await titleEl.getAttribute('href')

        if (!title || !href) { skipped++; continue }

        const location = (await card.locator(LOCATION_SELECTOR).first().textContent())?.trim() ?? ''
        if (!isUK(location)) { skipped++; continue }
        if (!isNew(config.name, href)) { skipped++; continue }

        const snippet = config.snippetSelector
          ? (await card.locator(config.snippetSelector).first().textContent())?.trim()
          : undefined

        if (config.sponsorshipBlockText && snippet?.includes(config.sponsorshipBlockText)) {
          save(config.name, href); skipped++; continue
        }

        if (!passesFilter(title, snippet)) { save(config.name, href); skipped++; continue }

        queueJob({ company: config.name, title, url: href, location, foundAt: new Date().toISOString() })
        save(config.name, href)
        queued++
      }

      hasMore = config.pagination && (await page.locator(NEXT_PAGE_SELECTOR).count()) > 0
      pageNum++
    }
  } finally {
    await browser.close()
  }

  console.log(`[clinch] ${config.name} — ${queued} queued, ${skipped} skipped`)
}

// ── Standalone test run ───────────────────────────────────────────────────────

if (require.main === module) {
  const config: ClinchConfig = {
    type: 'clinch', name: 'Zoom', schedule: 'slow', enabled: true,
    searchUrl: 'https://careers.zoom.us/jobs/search',
    params: { 'country_codes[]': 'GB' },
    titleSelector: '.job-search-results-card-title a',
    snippetSelector: '.job-search-results-summary',
    pagination: true,
  };

  (async () => {
    await scrapeClinch(config)
    console.log('[done] check data/pending.json')
  })().catch(err => { console.error('[clinch] Fatal:', err.message); process.exit(1) })
}
