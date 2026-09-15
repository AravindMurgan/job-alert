import path from 'path'
import { LowSync } from 'lowdb'
import { JSONFileSync } from 'lowdb/node'
import { PendingJob } from './types/company'

type SeenDb = {
  seenIds: Record<string, string[]>
  lastSeen: Record<string, string>
  lastSeenId: Record<string, number>
}

type PendingDb = PendingJob[]
type HistoryDb = PendingJob[]

const seenPath = path.resolve(__dirname, '../data/seen.json')
const pendingPath = path.resolve(__dirname, '../data/pending.json')
const historyPath = path.resolve(__dirname, '../data/history.json')

const seenAdapter = new JSONFileSync<SeenDb>(seenPath)
const seenDb = new LowSync<SeenDb>(seenAdapter, {
  seenIds: {},
  lastSeen: {},
  lastSeenId: {},
})

const pendingAdapter = new JSONFileSync<PendingDb>(pendingPath)
const pendingDb = new LowSync<PendingDb>(pendingAdapter, [])

const historyAdapter = new JSONFileSync<HistoryDb>(historyPath)
const historyDb = new LowSync<HistoryDb>(historyAdapter, [])

function readSeen(): void {
  seenDb.read()
}

function readPending(): void {
  pendingDb.read()
}

function readHistory(): void {
  historyDb.read()
}

const MAX_JOB_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function isNew(company: string, url: string): boolean {
  readPending()
  const cutoff = Date.now() - MAX_JOB_AGE_MS
  return !pendingDb.data.some(j =>
    j.company === company && j.url === url && new Date(j.foundAt).getTime() >= cutoff
  )
}

export function getLastSeen(company: string): string | undefined {
  readSeen()
  return seenDb.data.lastSeen[company]
}

export function getLastSeenId(company: string): number {
  readSeen()
  return seenDb.data.lastSeenId[company] ?? 0
}

export function saveLastSeenId(company: string, id: number): void {
  readSeen()
  seenDb.data.lastSeenId[company] = id
  seenDb.write()
}

export function addToPending(job: PendingJob): void {
  readPending()
  pendingDb.data.push(job)
  pendingDb.write()
  appendToHistory(job)
}

export function appendToHistory(job: PendingJob): void {
  readHistory()
  historyDb.data.push(job)
  historyDb.write()
}

export function getAllHistory(): PendingJob[] {
  readHistory()
  return historyDb.data
}

export function getAllPending(): PendingJob[] {
  readPending()
  return pendingDb.data
}

export function clearPending(): void {
  pendingDb.data = []
  pendingDb.write()
}

export function setPending(jobs: PendingJob[]): void {
  pendingDb.data = jobs
  pendingDb.write()
}
