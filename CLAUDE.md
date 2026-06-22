# Job Alert System

Automated job monitor for 246 UK Skilled Worker visa-sponsoring companies. Scans every 5 minutes, queues matched roles silently into `data/pending.json`, sends one HTML email digest at 12pm BST daily via Gmail SMTP. Zero cost, zero third-party services.

## Key Commands

```bash
# Install
npm install
npx playwright install chromium

# Type check
npx tsc --noEmit

# One-shot scan (used by GitHub Actions and local testing)
npx ts-node src/index.ts --once

# Send digest immediately (test or manual trigger)
npx ts-node src/digest.ts

# Run ATS discovery from CSV → generates data/companies.ts
npx ts-node scripts/discover.ts --input companies.csv
```

## Project Structure

```
src/
  index.ts          # Entry point — node-cron fast (5 min) + slow (30 min) tracks
  router.ts         # switch(config.type) → dispatches to correct scraper
  filter.ts         # Keyword matching — INCLUDE / EXCLUDE lists
  notify.ts         # queueJob(job) — appends to data/pending.json
  digest.ts         # Reads pending.json, builds HTML email, sends via Gmail, clears queue
  store.ts          # lowdb backend — isNew(), addToPending(), clearPending(), save()
  types/
    company.ts      # CompanyConfig discriminated union (all 8 ATS types)
  scrapers/
    rss.ts          # Greenhouse, Ashby, Lever — rss-parser, < 200ms
    oracle.ts       # Oracle HCM REST API — no browser, < 200ms
    workday.ts      # Playwright + URL params — ~15s
    clinch.ts       # Playwright + URL params + sponsorship block filter — ~10s
    avature.ts      # Playwright + UI interaction + numeric ID dedup — ~20s
    custom.ts       # Playwright + configurable CSS selectors — ~15s
data/
  companies.ts      # 246 company configs — edit here to add/remove/pause companies
  seen.json         # Auto-generated — committed after every scan run (dedup persists across GH Actions runs)
  pending.json      # Jobs queued for next digest — reset to [] after each digest send
scripts/
  discover.ts       # One-time ATS detection from CSV
.github/workflows/
  scan.yml          # Cron: */5 * * * * (fast) — RSS + Oracle scrapers
  digest.yml        # Cron: 0 11 * * * — 11:00 UTC = 12:00 BST
.env                # GMAIL_USER, GMAIL_APP_PASSWORD, DIGEST_TO — never commit
```

## Architecture

Two completely separate flows:

**Scan flow** (every 5 min via `scan.yml` / every 30 min for browser scrapers):
```
GitHub Actions → src/index.ts → src/router.ts → scraper
  → src/filter.ts → store.isNew() → src/notify.ts → data/pending.json
  → store.save() → data/seen.json committed
```

**Digest flow** (11:00 UTC daily via `digest.yml`):
```
GitHub Actions → src/digest.ts → reads pending.json
  → groups by company → builds HTML → nodemailer → Gmail SMTP
  → clears pending.json → []
```

If `pending.json` is empty at digest time, no email is sent.

## Data Models

### CompanyConfig (discriminated union — `src/types/company.ts`)

All types share `BaseConfig`:
```ts
type BaseConfig = {
  name: string
  enabled: boolean          // set false to pause without deleting
  schedule: "fast" | "slow" // fast = 5 min (RSS/API), slow = 30 min (browser)
  filter?: FilterOverride   // per-company keyword overrides
}
```

Type-specific fields:
```ts
// Greenhouse — feed: boards.greenhouse.io/feeds/{slug}/jobs.atom
{ type: "greenhouse"; slug: string }

// Ashby
{ type: "ashby"; slug: string }

// Lever
{ type: "lever"; slug: string }

// Oracle HCM
{ type: "oracle"; domain: string; siteNumber: string; keyword: string; locationId: string }

// Workday
{ type: "workday"; url: string; searchParam: string; searchTerm: string }

// Clinch
{ type: "clinch"; searchUrl: string; params: Record<string, string>; titleSelector: string;
  snippetSelector?: string; sponsorshipBlockText?: string; pagination: boolean }

// Avature
{ type: "avature"; searchUrl: string; keyword: string; sortOption: string;
  locationKeywords: string[]; idFromUrl: boolean }

// Custom
{ type: "custom"; url: string; searchSelector?: string; searchTerm?: string;
  submitSelector?: string; resultsSelector: string; titleSelector: string;
  linkSelector: string; locationSelector?: string }
```

### seen.json
```json
{
  "seenIds":    { "Monzo": ["id1", "id2"] },
  "lastSeen":   { "Monzo": "2026-06-22T09:05:00Z" },
  "lastSeenId": { "Tesco": 189031 }
}
```

### pending.json
```json
[
  {
    "company": "Monzo",
    "title": "Senior Frontend Engineer",
    "url": "https://boards.greenhouse.io/monzo/jobs/123",
    "location": "London, UK",
    "foundAt": "2026-06-22T09:05:12Z"
  }
]
```

## Filter Logic (`src/filter.ts`)

```
INCLUDE: react, typescript, next.js, node, frontend, full stack, javascript,
         software engineer, senior, lead, staff, principal, 5+ years, 6+ years

EXCLUDE: junior, graduate, intern, angular, php, no sponsorship,
         immigration sponsorship is not available, cannot sponsor,
         does not offer sponsorship
```

Filter layers applied in order:
1. **Title filter** — all ATS types — INCLUDE/EXCLUDE scan on job title
2. **Snippet filter** — RSS feeds — keyword scan on full JD body (free from feed content field)
3. **Location filter** — browser scrapers — check location field against UK keywords
4. **Sponsorship block** — Clinch, Custom — explicit "no sponsorship" text → skip immediately
5. **Deduplication** — all types — check ID/URL against `seen.json` before queuing

Vague titles (e.g. "Software Engineer – Growth Squad") that match neither list trigger a full JD body fetch for keyword scan.

## Deduplication Per ATS

| ATS | Dedup Key |
|-----|-----------|
| Greenhouse / Ashby / Lever | Feed item ID |
| Oracle HCM | PostingDate timestamp — skip anything older than lastSeen |
| Workday / Clinch / Custom | Job URL |
| Avature | Numeric job ID from URL — store max ID seen per company |

## ATS Coverage

| ATS | Speed | Companies |
|-----|-------|-----------|
| Greenhouse | < 200ms | Monzo, Wise, GoCardless |
| Ashby | < 200ms | Checkout.com, ClearBank |
| Lever | < 200ms | Revolut |
| Oracle HCM | < 200ms | JP Morgan, Goldman Sachs |
| Workday | ~15s | Barclays, HSBC, BT, Sky |
| Clinch | ~10s | Zoom |
| Avature | ~20s | Tesco |
| Custom | ~15s | Bespoke career pages |

~60% of companies use Greenhouse/Ashby/Lever (UK fintechs/startups).
~20% Workday (large corporates). ~10% Oracle (banks). ~10% other.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GMAIL_USER` | Gmail address used to send — `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-char Google App Password (Account → Security → 2FA → App Passwords) |
| `DIGEST_TO` | Recipient email for the daily digest |

Set in `.env` for local runs. Set as GitHub repo secrets (Settings → Secrets → Actions) for production.

## GitHub Actions Schedule

| Workflow | Cron | What it does |
|----------|------|-------------|
| `scan.yml` (fast) | `*/5 * * * *` | RSS + Oracle scrapers only |
| `scan.yml` (slow) | `*/30 * * * *` | Browser scrapers (Workday, Clinch, Avature, Custom) |
| `digest.yml` | `0 11 * * *` | Send email, clear queue |

**Minutes budget:** ~144 min/day × 30 = ~4,320 min/month. GitHub Free tier = 2,000 min/month.
If over budget: increase slow-track to `*/60 * * * *` to halve browser scraper runs.

`data/seen.json` must be committed after every scan run so dedup state persists across Actions runs.

## Adding / Pausing Companies

- **Pause:** set `enabled: false` in `data/companies.ts`, push
- **Add:** add a new entry to `data/companies.ts`, push
- **Bulk add:** run `scripts/discover.ts` against an updated CSV

## Workflow Integration with career-ops

This system handles discovery only. Output is a daily HTML email with clickable job URLs.

Downstream usage:
1. 12pm digest arrives with all roles from the last 24 hours
2. Each role title is a hyperlink — open the job posting
3. Paste URL into `/career-ops auto-pipeline {url}` for scoring + CV generation (~90s)
4. Score ≥ 4.0 → apply immediately

## Non-Requirements (explicitly out of scope)

- No AI/LLM in the pipeline — keyword matching only
- No paid services or API subscriptions
- No automated application submission
- No instant push notifications
- No dashboard or web UI
- No roles outside the United Kingdom
- No companies not on the UK Home Office sponsor register
