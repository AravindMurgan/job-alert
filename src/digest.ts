import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import { getAllPending, setPending, getAllHistory } from './store'
import { PendingJob } from './types/company'
import { buildReportHtml } from './report'

function formatPostedDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' })
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London',
  })
}

function buildHtml(grouped: Record<string, PendingJob[]>, total: number): string {
  const companySections = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([company, jobs]) => {
      const rows = jobs.map(j => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:14px;">
            <a href="${j.url}" style="color:#00BFA6;text-decoration:none;font-weight:500;">${j.title}</a>
          </td>
          <td style="padding:6px 12px 6px 0;font-size:13px;color:#7A8FA8;white-space:nowrap;">${j.location}</td>
          <td style="padding:6px 0;font-size:12px;color:#7A8FA8;white-space:nowrap;font-family:monospace;">Posted ${formatPostedDate(j.foundAt)}</td>
        </tr>`).join('')

      return `
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#00BFA6;
                      font-weight:600;margin-bottom:10px;padding-bottom:8px;
                      border-bottom:1px solid #2E3D52;">
            ${company} &middot; ${jobs.length} new ${jobs.length === 1 ? 'role' : 'roles'}
          </div>
          <table style="border-collapse:collapse;width:100%;">
            ${rows}
          </table>
        </div>`
    }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#141E2B;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;">

    <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #2E3D52;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
                  color:#00BFA6;margin-bottom:8px;">Job Alert Digest</div>
      <div style="font-size:24px;font-weight:700;color:#E8F0F6;margin-bottom:4px;">${formatDate()}</div>
      <div style="font-size:14px;color:#7A8FA8;">
        ${total} new ${total === 1 ? 'role' : 'roles'} across ${Object.keys(grouped).length} ${Object.keys(grouped).length === 1 ? 'company' : 'companies'}
      </div>
    </div>

    ${companySections}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #2E3D52;
                font-size:11px;color:#4A6070;font-family:monospace;letter-spacing:0.06em;">
      JOB-ALERT · 246 UK VISA SPONSORS · SCAN EVERY 5 MIN
    </div>

  </div>
</body>
</html>`
}

const MAX_JOB_AGE_MS = 30 * 24 * 60 * 60 * 1000

async function sendDigest(): Promise<void> {
  const cutoff = Date.now() - MAX_JOB_AGE_MS
  const all = getAllPending()
  const active = all.filter(job => new Date(job.foundAt).getTime() >= cutoff)
  const expired = all.length - active.length

  if (expired > 0) setPending(active)

  const activeHistory = getAllHistory().filter(job => new Date(job.foundAt).getTime() >= cutoff)
  fs.writeFileSync(path.resolve(__dirname, '../report.html'), buildReportHtml(activeHistory))

  if (active.length === 0) {
    console.log('[digest] No active jobs — skipping')
    return
  }

  const grouped = active.reduce<Record<string, PendingJob[]>>((acc, job) => {
    acc[job.company] = [...(acc[job.company] ?? []), job]
    return acc
  }, {})

  for (const companyJobs of Object.values(grouped)) {
    companyJobs.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime())
  }

  const total = active.length
  const companyCount = Object.keys(grouped).length
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const subject = `${total} new ${total === 1 ? 'job' : 'jobs'} — ${dateLabel}`

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `Job Alert <${process.env.GMAIL_USER}>`,
    to: process.env.DIGEST_TO,
    subject,
    html: buildHtml(grouped, total),
  })

  console.log(`[digest] Sent — ${total} jobs across ${companyCount} companies → ${process.env.DIGEST_TO}`)
}

sendDigest().catch(err => {
  console.error('[digest] Failed:', err.message)
  process.exit(1)
})
