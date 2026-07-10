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
]

// Seniority — only relevant when combined with a TECH match in title
const SENIORITY = ['senior', 'lead', 'staff', 'principal', 'tech lead', 'technical lead']

export const INCLUDE = [...TECH, ...SENIORITY]

export const EXCLUDE = [
  // Level
  'junior', 'graduate', 'intern', 'internship', 'apprentice',

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
]

const UK_LOCATIONS = [
  'uk', 'united kingdom', 'england', 'london', 'manchester', 'birmingham',
  'bristol', 'edinburgh', 'glasgow', 'leeds', 'cambridge', 'oxford',
  'cardiff', 'sheffield', 'remote (uk)', 'hybrid (uk)',
]

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

export function isUK(location: string): boolean {
  if (!location) return false
  return matchesAny(location, UK_LOCATIONS)
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
