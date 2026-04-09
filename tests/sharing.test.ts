import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearShareUrl, copyToClipboard, decodeShareUrl, encodeShareUrl } from '@/lib/sharing'

describe('encodeShareUrl', () => {
  it('returns an error for empty input', () => {
    expect(encodeShareUrl('', 'https://example.com/').ok).toBe(false)
  })

  it('returns a share URL for valid input', () => {
    const result = encodeShareUrl('2024-01-15 ERROR user_id=42', 'https://example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toContain('#q=')
    }
  })
})

describe('decodeShareUrl', () => {
  it('round-trips encoded input exactly', () => {
    const input = '2024-01-15 ERROR user_id=42'
    const encoded = encodeShareUrl(input, 'https://example.com/')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) {
      return
    }

    const decoded = decodeShareUrl(`#${encoded.url.split('#')[1]}`)
    expect(decoded).toEqual({ ok: true, input })
  })

  it('returns an error for corrupted data', () => {
    expect(decodeShareUrl('#q=not-valid-data')).toEqual({
      ok: false,
      reason: 'Failed to decode shared URL. The link may be corrupted or truncated.',
    })
  })
})

describe('clipboard and URL helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('copies text using the Clipboard API when available', async () => {
    expect(await copyToClipboard('hello world')).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
  })

  it('clears the hash fragment without reloading the page', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    window.history.replaceState(null, '', '/#q=abc')
    clearShareUrl()
    expect(replaceState).toHaveBeenLastCalledWith(null, '', `${window.location.pathname}${window.location.search}`)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
