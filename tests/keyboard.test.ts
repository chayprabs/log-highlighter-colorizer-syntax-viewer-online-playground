import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatShortcut, registerShortcuts, SHORTCUTS } from '@/lib/keyboard'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SHORTCUTS', () => {
  it('has no duplicate ids', () => {
    const ids = SHORTCUTS.map(shortcut => shortcut.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicate key combinations', () => {
    const combos = SHORTCUTS.map(shortcut =>
      [shortcut.key, shortcut.ctrl ?? false, shortcut.shift ?? false, shortcut.alt ?? false].join(':')
    )
    expect(new Set(combos).size).toBe(combos.length)
  })
})

describe('formatShortcut', () => {
  it('formats modifier shortcuts for display', () => {
    expect(formatShortcut({ id: 'share', label: 'Share', key: 's', ctrl: true })).toContain('S')
    expect(formatShortcut({ id: 'dismiss', label: 'Dismiss', key: 'Escape' })).toBe('Escape')
  })
})

describe('registerShortcuts', () => {
  it('returns a cleanup function', () => {
    const cleanup = registerShortcuts({})
    expect(typeof cleanup).toBe('function')
    cleanup()
  })

  it('fires the matching handler on keydown', () => {
    const onFocus = vi.fn()
    const cleanup = registerShortcuts({ 'focus-input': onFocus })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
    cleanup()

    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('prevents the browser save shortcut when sharing', () => {
    const onShare = vi.fn()
    const cleanup = registerShortcuts({ share: onShare })

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })

    document.dispatchEvent(event)
    cleanup()

    expect(event.defaultPrevented).toBe(true)
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('removes the same listener during cleanup', () => {
    const onDismiss = vi.fn()
    const cleanup = registerShortcuts({ dismiss: onDismiss })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    cleanup()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
