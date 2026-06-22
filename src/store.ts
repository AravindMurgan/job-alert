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

const seenPath = path.resolve(__dirname, '../data/seen.json')
const pendingPath = path.resolve(__dirname, '../data/pending.json')

const seenAdapter = new JSONFileSync<SeenDb>(seenPath)
const seenDb = new LowSync<SeenDb>(seenAdapter, {
  seenIds: {},
  lastSeen: {},
  lastSeenId: {},
})

const pendingAdapter = new JSONFileSync<PendingDb>(pendingPath)
const pendingDb = new LowSync<PendingDb>(pendingAdapter, [])

function readSeen(): void {
  seenDb.read()
}

function readPending(): void {
  pendingDb.read()
}

export function isNew(company: string, id: string): boolean {
  readSeen()
  const ids = seenDb.data.seenIds[company] ?? []
  return !ids.includes(id)
}

export function save(company: string, id: string): void {
  readSeen()
  if (!seenDb.data.seenIds[company]) {
    seenDb.data.seenIds[company] = []
  }
  seenDb.data.seenIds[company].push(id)
  seenDb.data.lastSeen[company] = new Date().toISOString()
  seenDb.write()
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
}

export function getAllPending(): PendingJob[] {
  readPending()
  return pendingDb.data
}

export function clearPending(): void {
  pendingDb.data = []
  pendingDb.write()
}
