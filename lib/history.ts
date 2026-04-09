/**
 * Session history for log highlighter inputs.
 *
 * Privacy model:
 *   - All data is stored in localStorage (browser-local only)
 *   - No data is sent to any server at any point
 *   - User can clear all history at any time
 *   - History persists across page refreshes but not across browsers or devices
 *
 * Storage limits:
 *   - MAX_ENTRIES: 10 entries maximum
 *   - MAX_ENTRY_BYTES: 50,000 bytes per entry
 *   - MAX_TOTAL_BYTES: 500,000 bytes total across all entries
 *
 * Entry format:
 *   { id, timestamp, preview, input, byteSize }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'log-hl:history'
const MAX_ENTRIES = 10
const MAX_ENTRY_BYTES = 50_000
const MAX_TOTAL_BYTES = 500_000
const PREVIEW_LENGTH = 120

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  /** Unique identifier for this entry (timestamp-based) */
  id: string
  /** ISO timestamp of when this was saved */
  timestamp: string
  /** First PREVIEW_LENGTH characters of the raw input, for display */
  preview: string
  /** Full raw log input */
  input: string
  /** Byte size of the input */
  byteSize: number
  /** Number of lines in the input */
  lineCount: number
}

export type HistorySaveResult =
  | { ok: true; entry: HistoryEntry }
  | { ok: false; reason: string }

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Reads all history entries from localStorage.
 * Returns empty array if storage is unavailable or data is malformed.
 *
 * @returns Array of HistoryEntry sorted newest first
 */
export function getHistory(): HistoryEntry[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as HistoryEntry[]
  } catch {
    return []
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Saves a log input to history.
 *
 * Will not save if:
 *   - Input is empty or whitespace only
 *   - Input exceeds MAX_ENTRY_BYTES
 *   - Input is identical to the most recent entry (deduplication)
 *
 * If saving would exceed MAX_ENTRIES or MAX_TOTAL_BYTES,
 * the oldest entries are removed until it fits.
 *
 * @param rawInput - The raw log text to save
 * @returns HistorySaveResult
 */
export function saveToHistory(rawInput: string): HistorySaveResult {
  if (!rawInput || rawInput.trim() === '') {
    return { ok: false, reason: 'Empty input not saved.' }
  }

  const byteSize = new Blob([rawInput]).size

  if (byteSize > MAX_ENTRY_BYTES) {
    return {
      ok: false,
      reason: `Input is ${Math.round(byteSize / 1024)} KB — too large to save to history (max ${MAX_ENTRY_BYTES / 1000} KB per entry).`,
    }
  }

  try {
    const existing = getHistory()

    // Deduplication: don't save if identical to most recent entry
    if (existing.length > 0 && existing[0].input === rawInput) {
      return { ok: false, reason: 'Identical to most recent entry — not saved.' }
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      preview: rawInput.slice(0, PREVIEW_LENGTH).replace(/\n/g, ' ').trim(),
      input: rawInput,
      byteSize,
      lineCount: (rawInput.match(/\n/g) ?? []).length + 1,
    }

    let updated = [entry, ...existing]

    // Trim to max entries
    if (updated.length > MAX_ENTRIES) {
      updated = updated.slice(0, MAX_ENTRIES)
    }

    // Trim to max total bytes
    let totalBytes = updated.reduce((sum, e) => sum + e.byteSize, 0)
    while (totalBytes > MAX_TOTAL_BYTES && updated.length > 1) {
      const removed = updated.pop()!
      totalBytes -= removed.byteSize
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return { ok: true, entry }
  } catch (err) {
    // localStorage can throw if storage quota is exceeded
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      // Try to clear old entries and retry once
      try {
        clearHistory()
        return saveToHistory(rawInput)
      } catch {
        return { ok: false, reason: 'Browser storage is full. History could not be saved.' }
      }
    }
    return { ok: false, reason: 'Failed to save to history.' }
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Removes a single history entry by id.
 *
 * @param id - The entry id to remove
 * @returns true if entry was found and removed, false if not found
 */
export function deleteHistoryEntry(id: string): boolean {
  try {
    const existing = getHistory()
    const filtered = existing.filter(e => e.id !== id)
    if (filtered.length === existing.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}

/**
 * Removes all history entries from localStorage.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ─── Format ───────────────────────────────────────────────────────────────────

/**
 * Formats a history entry timestamp for display.
 * Shows relative time for recent entries, absolute for older ones.
 *
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Human-readable time string
 */
export function formatHistoryTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
