import { describe, it, expect } from 'vitest'
import { SHORTCUTS, formatShortcut, registerShortcuts, isMac } from '../lib/keyboard'

describe('SHORTCUTS config', () => {
  it('has no duplicate ids', () => {
    const ids = SHORTCUTS.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('has no duplicate key combinations', () => {
    const combos = SHORTCUTS.map(s =>
      [s.key, s.ctrl, s.shift, s.alt].join('-')
    )
    const unique = new Set(combos)
    expect(unique.size).toBe(combos.length)
  })

  it('every shortcut has an id, label, and key', () => {
    for (const s of SHORTCUTS) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.key).toBeTruthy()
    }
  })
})

describe('formatShortcut', () => {
  it('formats a ctrl+key shortcut', () => {
    const s = { id: 'test', label: 'Test', key: 'k', ctrl: true }
    const result = formatShortcut(s)
    expect(result).toContain('K')
    // Contains the modifier (either Cmd or Ctrl depending on platform)
    expect(result.length).toBeGreaterThan(1)
  })

  it('formats a ctrl+shift+key shortcut', () => {
    const s = { id: 'test', label: 'Test', key: 'c', ctrl: true, shift: true }
    const result = formatShortcut(s)
    expect(result).toContain('Shift')
    expect(result).toContain('C')
  })

  it('formats an escape shortcut without modifiers', () => {
    const s = { id: 'dismiss', label: 'Dismiss', key: 'Escape' }
    const result = formatShortcut(s)
    expect(result).toBe('ESCAPE')
  })
})

describe('registerShortcuts', () => {
  it('returns a cleanup function', () => {
    const cleanup = registerShortcuts({})
    expect(typeof cleanup).toBe('function')
    cleanup() // must not throw
  })

  it('calls handler when matching keydown event fires', () => {
    let called = false
    const cleanup = registerShortcuts({
      'focus-input': () => { called = true },
    })

    // Simulate Ctrl+K keydown
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)

    cleanup()
    expect(called).toBe(true)
  })

  it('does not call handler for non-matching key', () => {
    let called = false
    const cleanup = registerShortcuts({
      'focus-input': () => { called = true },
    })

    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })
    document.dispatchEvent(event)

    cleanup()
    expect(called).toBe(false)
  })

  it('cleanup removes the listener', () => {
    let callCount = 0
    const cleanup = registerShortcuts({
      'focus-input': () => { callCount++ },
    })

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
    document.dispatchEvent(event)
    expect(callCount).toBe(1)

    cleanup()
    document.dispatchEvent(event)
    expect(callCount).toBe(1) // still 1, listener removed
  })
})