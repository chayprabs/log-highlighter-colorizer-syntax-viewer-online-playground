import { describe, it, expect, beforeEach } from 'vitest'
import { encodeShareUrl, decodeShareUrl, copyToClipboard, clearShareUrl } from '../lib/sharing'

describe('encodeShareUrl', () => {
  it('produces a valid URL for normal log input', () => {
    const result = encodeShareUrl('2024-01-15 10:23:45 INFO hello world', 'https://example.com/')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.url).toContain('#q=')
      expect(result.url).toContain('https://example.com/')
    }
  })

  it('returns error for empty input', () => {
    const result = encodeShareUrl('', 'https://example.com/')
    expect(result.ok).toBe(false)
  })

  it('returns error for whitespace-only input', () => {
    const result = encodeShareUrl('   \n  ', 'https://example.com/')
    expect(result.ok).toBe(false)
  })

  it('returns error for input exceeding max length', () => {
    const result = encodeShareUrl('a'.repeat(50_001), 'https://example.com/')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('too large')
    }
  })

  it('strips existing hash from base URL', () => {
    const result = encodeShareUrl('hello', 'https://example.com/#q=oldstuff')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should not double-encode
      const hashCount = (result.url.match(/#/g) ?? []).length
      expect(hashCount).toBe(1)
    }
  })

  it('round-trips correctly — encode then decode returns original', () => {
    const original = '2024-01-15 ERROR user_id=42 GET /api/users 500 192.168.1.1'
    const encoded = encodeShareUrl(original, 'https://example.com/')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = decodeShareUrl('#' + encoded.url.split('#')[1])
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(decoded.input).toBe(original)
    }
  })

  it('round-trips multiline logs correctly', () => {
    const original = [
      '2024-01-15 10:23:45 INFO starting server port=3000',
      '2024-01-15 10:23:46 DEBUG connected to db host=localhost',
      '2024-01-15 10:23:47 ERROR connection timeout after 30s uuid=550e8400-e29b-41d4-a716-446655440000',
    ].join('\n')

    const encoded = encodeShareUrl(original, 'https://example.com/')
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = decodeShareUrl('#' + encoded.url.split('#')[1])
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(decoded.input).toBe(original)
    }
  })
})

describe('decodeShareUrl', () => {
  it('returns error for empty hash', () => {
    expect(decodeShareUrl('').ok).toBe(false)
    expect(decodeShareUrl('#').ok).toBe(false)
  })

  it('returns error for hash with no q param', () => {
    expect(decodeShareUrl('#someotherhash').ok).toBe(false)
  })

  it('returns error for corrupted encoded data', () => {
    const result = decodeShareUrl('#q=!!!invalid!!!base64!!!data!!!')
    expect(result.ok).toBe(false)
  })

  it('handles hash with leading # correctly', () => {
    const encoded = encodeShareUrl('hello', 'https://example.com/')
    if (!encoded.ok) return
    const hash = '#' + encoded.url.split('#')[1]
    const decoded = decodeShareUrl(hash)
    expect(decoded.ok).toBe(true)
  })
})