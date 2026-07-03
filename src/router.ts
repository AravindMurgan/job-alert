import { CompanyConfig } from './types/company'
import { scrapeRss } from './scrapers/rss'
import { scrapeOracle } from './scrapers/oracle'
import { scrapeWorkday } from './scrapers/workday'

export async function scrape(config: CompanyConfig): Promise<void> {
  if (!config.enabled) return

  switch (config.type) {
    case 'greenhouse':
    case 'ashby':
    case 'lever':
      await scrapeRss(config)
      break
    case 'oracle':
      await scrapeOracle(config)
      break
    case 'workday':
      await scrapeWorkday(config)
      break
    case 'clinch':
    case 'avature':
    case 'custom':
      console.log(`[router] ${config.name} — ${config.type} scraper not yet implemented, skipping`)
      break
  }
}
