const STORAGE_KEY = 'log-hl:history'
const MAX_ENTRIES = 10
const MAX_ENTRY_BYTES = 50_000
const MAX_TOTAL_BYTES = 500_000
const PREVIEW_LENGTH = 120

export interface HistoryEntry {
  id: string
  timestamp: string
  preview: string
  input: string
  byteSize: number
  lineCount: number
}

export type HistorySaveResult =
  | { ok: true; entry: HistoryEntry }
  | { ok: false; reason: string }

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<HistoryEntry>
  return (
    typeof candidate.id === 'string'
    && typeof candidate.timestamp === 'string'
    && typeof candidate.preview === 'string'
    && typeof candidate.input === 'string'
    && typeof candidate.byteSize === 'number'
    && typeof candidate.lineCount === 'number'
  )
}

function safeReadHistory(): HistoryEntry[] {
  if (!hasStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isHistoryEntry)
  } catch {
    return []
  }
}

export function getHistory(): HistoryEntry[] {
  return safeReadHistory()
}

export function saveToHistory(rawInput: string): HistorySaveResult {
  if (!rawInput || rawInput.trim() === '') {
    return { ok: false, reason: 'Empty input not saved.' }
  }

  if (!hasStorage()) {
    return { ok: false, reason: 'History is unavailable in this environment.' }
  }

  const byteSize = new Blob([rawInput]).size
  if (byteSize > MAX_ENTRY_BYTES) {
    return {
      ok: false,
      reason: `Input is ${Math.round(byteSize / 1024)} KB - too large to save to history (max ${MAX_ENTRY_BYTES / 1000} KB per entry).`,
    }
  }

  try {
    const existing = safeReadHistory()
    if (existing[0]?.input === rawInput) {
      return { ok: false, reason: 'Identical to most recent entry - not saved.' }
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      preview: rawInput.slice(0, PREVIEW_LENGTH).replace(/\s+/g, ' ').trim(),
      input: rawInput,
      byteSize,
      lineCount: rawInput.split('\n').length,
    }

    let updated = [entry, ...existing].slice(0, MAX_ENTRIES)
    let totalBytes = updated.reduce((sum, current) => sum + current.byteSize, 0)

    while (totalBytes > MAX_TOTAL_BYTES && updated.length > 1) {
      const removed = updated.pop()
      if (!removed) {
        break
      }
      totalBytes -= removed.byteSize
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return { ok: true, entry }
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        clearHistory()
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              preview: rawInput.slice(0, PREVIEW_LENGTH).replace(/\s+/g, ' ').trim(),
              input: rawInput,
              byteSize,
              lineCount: rawInput.split('\n').length,
            } satisfies HistoryEntry,
          ])
        )
        return { ok: true, entry: getHistory()[0] }
      } catch {
        return { ok: false, reason: 'Browser storage is full. History could not be saved.' }
      }
    }

    return { ok: false, reason: 'Failed to save to history.' }
  }
}

export function deleteHistoryEntry(id: string): boolean {
  if (!hasStorage()) {
    return false
  }

  try {
    const existing = safeReadHistory()
    const filtered = existing.filter(entry => entry.id !== id)
    if (filtered.length === existing.length) {
      return false
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}

export function clearHistory(): void {
  if (!hasStorage()) {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function formatHistoryTime(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp)
  if (Number.isNaN(timestamp.getTime())) {
    return 'unknown time'
  }

  const diffMs = Date.now() - timestamp.getTime()
  if (diffMs < 60_000) {
    return 'just now'
  }

  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return timestamp.toLocaleDateString()
}
