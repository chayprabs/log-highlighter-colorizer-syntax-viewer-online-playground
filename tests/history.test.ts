import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getHistory,
  saveToHistory,
  deleteHistoryEntry,
  clearHistory,
  formatHistoryTime,
} from '../lib/history'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
})

describe('getHistory', () => {
  it('returns empty array when no history exists', () => {
    expect(getHistory()).toEqual([])
  })

  it('returns empty array when localStorage has malformed data', () => {
    localStorageMock.setItem('log-hl:history', 'not valid json {{{')
    expect(getHistory()).toEqual([])
  })
})

describe('saveToHistory', () => {
  it('saves a valid entry', () => {
    const result = saveToHistory('2024-01-15 INFO hello world')
    expect(result.ok).toBe(true)
    const history = getHistory()
    expect(history).toHaveLength(1)
    expect(history[0].input).toBe('2024-01-15 INFO hello world')
  })

  it('does not save empty input', () => {
    const result = saveToHistory('')
    expect(result.ok).toBe(false)
  })

  it('does not save whitespace-only input', () => {
    const result = saveToHistory('   \n  ')
    expect(result.ok).toBe(false)
  })

  it('does not save input exceeding 50KB', () => {
    const result = saveToHistory('a'.repeat(50_001))
    expect(result.ok).toBe(false)
  })

  it('deduplicates consecutive identical inputs', () => {
    const input = '2024-01-15 INFO same log'
    saveToHistory(input)
    const result = saveToHistory(input)
    expect(result.ok).toBe(false)
    expect(getHistory()).toHaveLength(1)
  })

  it('saves non-identical entries separately', () => {
    saveToHistory('2024-01-15 INFO first log')
    saveToHistory('2024-01-15 INFO second log')
    expect(getHistory()).toHaveLength(2)
  })

  it('keeps newest first', () => {
    saveToHistory('first')
    saveToHistory('second')
    const history = getHistory()
    expect(history[0].input).toBe('second')
    expect(history[1].input).toBe('first')
  })

  it('trims to 10 entries maximum', () => {
    for (let i = 1; i <= 12; i++) {
      saveToHistory(`log entry number ${i} with unique content`)
    }
    expect(getHistory()).toHaveLength(10)
  })

  it('stores preview, lineCount, byteSize on each entry', () => {
    saveToHistory('line one\nline two\nline three')
    const entry = getHistory()[0]
    expect(entry.preview).toBeTruthy()
    expect(entry.lineCount).toBe(3)
    expect(entry.byteSize).toBeGreaterThan(0)
    expect(entry.timestamp).toBeTruthy()
    expect(entry.id).toBeTruthy()
  })
})

describe('deleteHistoryEntry', () => {
  it('removes an entry by id', () => {
    saveToHistory('entry to delete')
    const entry = getHistory()[0]
    const result = deleteHistoryEntry(entry.id)
    expect(result).toBe(true)
    expect(getHistory()).toHaveLength(0)
  })

  it('returns false for non-existent id', () => {
    const result = deleteHistoryEntry('nonexistent-id-12345')
    expect(result).toBe(false)
  })
})

describe('clearHistory', () => {
  it('removes all entries', () => {
    saveToHistory('entry one extra unique content')
    saveToHistory('entry two extra unique content')
    clearHistory()
    expect(getHistory()).toHaveLength(0)
  })

  it('does not throw when history is already empty', () => {
    expect(() => clearHistory()).not.toThrow()
  })
})

describe('formatHistoryTime', () => {
  it('returns "just now" for very recent timestamps', () => {
    const now = new Date().toISOString()
    expect(formatHistoryTime(now)).toBe('just now')
  })

  it('returns minutes ago format', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(formatHistoryTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns hours ago format', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
    expect(formatHistoryTime(twoHoursAgo)).toBe('2h ago')
  })
})
