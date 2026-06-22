import { PendingJob } from './types/company'
import { addToPending } from './store'

export function queueJob(job: PendingJob): void {
  addToPending(job)
  console.log(`[queued] ${job.company} — ${job.title}`)
}
