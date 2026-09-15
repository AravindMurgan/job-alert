// Frontend / full-stack tech keywords — must match at least one
const TECH = [
  'react', 'next.js', 'nextjs', 'vue', 'svelte',
  'frontend', 'front-end', 'front end',
  'full stack', 'fullstack', 'full-stack',
  'javascript', 'typescript',
  'ui engineer', 'ui developer',
  'web engineer', 'web developer',
  'html', 'css',
  'java', 'spring', 'spring boot',
  'node.js', 'nodejs', 'node js',
  '.net', 'dotnet', 'c#', 'asp.net',
  'product engineer', 'software engineer', 'software developer',
  'development engineer', 'software development engineer', 'sde',
  'software', 'engineer'
]

// Seniority — only relevant when combined with a TECH match in title
const SENIORITY = ['senior', 'lead', 'tech lead', 'technical lead']

export const INCLUDE = [...TECH, ...SENIORITY]

export const EXCLUDE = [
  // Level
  'junior', 'graduate', 'intern', 'internship', 'apprentice',

  // Excluded seniority levels
  'staff', 'principal',
  'lead software engineer', 'lead engineer', 'lead developer',

  // Wrong discipline — backend / infrastructure / ops
  'backend engineer', 'backend developer', 'backend engineering',
  'back-end engineer', 'back-end developer',
  'devops engineer', 'infrastructure engineer',
  'site reliability', 'sre',
  'cloud engineer', 'network engineer',
  'security engineer',

  // Wrong discipline — data/ML
  'data engineer', 'data scientist',
  'machine learning engineer', 'ml engineer',

  // Wrong discipline — native mobile
  'android engineer', 'android developer',
  'ios engineer', 'ios developer',
  'mobile engineer',
  'flutter', 'swift',

  // Wrong discipline — embedded/hardware
  'embedded', 'firmware',
  'fpga', 'vhdl', 'verilog',

  // Visa blockers — explicit no-sponsorship phrases
  'no sponsorship',
  'immigration sponsorship is not available',
  'cannot sponsor',
  'does not offer sponsorship',
  'we are unable to sponsor',
  'unable to offer sponsorship',
  'sponsorship is not available',
  'right to work only',
  'you must have the right to work',

  // Contract/day-rate — visa blocked
  'outside ir35',
  'day rate',
  'day-rate',

  // SC / DV clearance — 5yr residency required
  'sc clearance required',
  'dv clearance',
  'security clearance required',
  'active sc clearance',

  // Primary stacks too far from profile
  'golang engineer', 'go engineer',
  'rust engineer',
  'php developer', 'php engineer',
  'ruby on rails engineer',  // note: rails is acceptable as secondary
  'scala engineer',
  'kotlin engineer',

  //senior
  'director',
  'electrical engineer',
  'quantitative',

  // Wrong discipline — hardware / mechanical / manufacturing / ops
  'mechanical engineer', 'manufacturing engineer', 'manufacturing engineering',
  'automation engineer', 'factory automation', 'robotics',
  'systems engineer', 'system build engineer',

  // Wrong discipline — IT support / non-dev
  'it support', 'support engineer', 'help desk',

  // Management-track, not IC engineering
  'engineering manager',
]

// Country/nation-level phrases — the primary safety net, since almost
// every ATS location string includes one of these regardless of city
const UK_COUNTRY_PHRASES = [
  'uk', 'united kingdom', 'great britain',
  'england', 'scotland', 'wales', 'northern ireland', 'n. ireland',
  'remote (uk)', 'hybrid (uk)',
]

// Short country abbreviations (e.g. Workday's "Nottingham,  Eng" or
// "Belfast, NI") — matched as whole words only, since plain substring
// matching would false-positive on unrelated text ("eng" inside
// "Bengaluru", "ni" inside "California")
const UK_ABBREVIATIONS = ['eng', 'scot', 'ni', 'gb']

// City/town names alone are NOT a reliable UK signal — several share a
// name with a place elsewhere (York/New York, Cambridge/MA, Birmingham/AL,
// Bristol/CT, Manchester/NH). These only count as UK if nothing in
// NON_UK_MARKERS also appears in the same location string.
const UK_CITIES = [
  'london', 'manchester', 'birmingham', 'bristol', 'edinburgh', 'glasgow',
  'leeds', 'cambridge', 'oxford', 'cardiff', 'sheffield',
  'nottingham', 'newcastle', 'liverpool', 'leicester', 'coventry',
  'belfast', 'southampton', 'portsmouth', 'brighton', 'reading',
  'milton keynes', 'derby', 'hull', 'york', 'bath', 'exeter', 'plymouth',
  'norwich', 'ipswich', 'swansea', 'aberdeen', 'dundee', 'inverness',
  'watford', 'luton', 'peterborough', 'chester', 'preston', 'sunderland',
  'middlesbrough', 'durham', 'gloucester', 'swindon', 'bournemouth',
  'colchester', 'chelmsford', 'canterbury', 'stevenage', 'northampton',
  'warwick', 'guildford', 'slough', 'wolverhampton', 'blackpool',
  'bradford', 'stoke', 'basingstoke', 'croydon', 'wokingham',
  'knutsford', 'radbroke hall',
]

// Non-UK countries and US states that share a name with a UK city —
// overrides a city-only match (a genuine UK country phrase/abbreviation
// match above always wins regardless of these)
const NON_UK_MARKERS = [
  'usa', 'united states', 'u.s.a', 'canada', 'australia', 'singapore',
  'india', 'germany', 'france', 'netherlands', 'poland', 'spain', 'italy',
  'japan', 'china', 'brazil', 'mexico',
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
  'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
  'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york',
  'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
  'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
  'west virginia', 'wisconsin', 'wyoming',
]

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

function matchesWholeWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(text)
}

// Republic of Ireland is not UK, but "Northern Ireland" is — checked
// separately since bare "ireland" is also a substring of "northern ireland"
function isRepublicOfIreland(text: string): boolean {
  const lower = text.toLowerCase()
  return matchesWholeWord(lower, 'ireland') && !lower.includes('northern ireland') && !lower.includes('n. ireland')
}

export function isUK(location: string): boolean {
  if (!location) return false

  const hasCountrySignal =
    matchesAny(location, UK_COUNTRY_PHRASES) || UK_ABBREVIATIONS.some(w => matchesWholeWord(location, w))
  if (hasCountrySignal) return true

  if (!matchesAny(location, UK_CITIES)) return false
  if (isRepublicOfIreland(location)) return false
  return !matchesAny(location, NON_UK_MARKERS)
}

export function passesFilter(title: string, snippet?: string): boolean {
  if (matchesAny(title, EXCLUDE)) return false
  if (matchesAny(title, TECH)) return true
  if (snippet && matchesAny(snippet, TECH)) return true
  return false
}

const MAX_JOB_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function isRecent(postedAt: string): boolean {
  return Date.now() - new Date(postedAt).getTime() <= MAX_JOB_AGE_MS
}
