import 'dotenv/config'
import cron from 'node-cron'
import { companies } from '../data/companies'
import { scrape } from './router'

const once = process.argv.includes('--once')

async function runTrack(schedule: 'fast' | 'slow'): Promise<void> {
  const targets = companies.filter(c => c.enabled && c.schedule === schedule)
  console.log(`[index] ${schedule} track — ${targets.length} companies`)
  for (const config of targets) {
    await scrape(config).catch(err =>
      console.error(`[index] ${config.name} failed:`, err.message)
    )
  }
}

async function runOnce(): Promise<void> {
  await runTrack('fast')
  await runTrack('slow')
  console.log('[index] --once complete')
}

if (once) {
  runOnce().catch(err => { console.error('[index] Fatal:', err.message); process.exit(1) })
} else {
  cron.schedule('*/5 * * * *', () => { runTrack('fast').catch(console.error) })
  cron.schedule('*/30 * * * *', () => { runTrack('slow').catch(console.error) })
  console.log('[index] Scheduler started — fast: */5, slow: */30')
}
