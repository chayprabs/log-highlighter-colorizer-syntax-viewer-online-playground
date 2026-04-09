import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearHistory,
  deleteHistoryEntry,
  formatHistoryTime,
  getHistory,
  saveToHistory,
} from '@/lib/history'

const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
})

beforeEach(() => {
  localStorageMock.clear()
})

describe('saveToHistory', () => {
  it('rejects empty input', () => {
    expect(saveToHistory('').ok).toBe(false)
  })

  it('saves valid input and makes it readable through getHistory', () => {
    expect(saveToHistory('2024-01-15 ERROR user_id=42').ok).toBe(true)
    expect(getHistory()).toHaveLength(1)
  })

  it('deduplicates consecutive identical entries', () => {
    saveToHistory('same log')
    expect(saveToHistory('same log').ok).toBe(false)
    expect(getHistory()).toHaveLength(1)
  })

  it('keeps only the 10 newest entries', () => {
    for (let index = 0; index < 11; index += 1) {
      saveToHistory(`entry-${index}`)
    }

    const history = getHistory()
    expect(history).toHaveLength(10)
    expect(history[0].input).toBe('entry-10')
    expect(history.at(-1)?.input).toBe('entry-1')
  })
})

describe('history mutations', () => {
  it('deletes an entry by id', () => {
    saveToHistory('entry to delete')
    const [entry] = getHistory()
    expect(deleteHistoryEntry(entry.id)).toBe(true)
    expect(getHistory()).toHaveLength(0)
  })

  it('clears the full history', () => {
    saveToHistory('one')
    saveToHistory('two')
    clearHistory()
    expect(getHistory()).toEqual([])
  })
})

describe('formatHistoryTime', () => {
  it('handles recent timestamps and invalid input safely', () => {
    expect(formatHistoryTime(new Date().toISOString())).toBe('just now')
    expect(formatHistoryTime('not-a-date')).toBe('unknown time')
  })
})
