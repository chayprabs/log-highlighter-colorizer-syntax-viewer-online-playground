import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { escapeHtml, highlightLog, sanitizeInput } from '@/lib/highlighter'
import { checkRateLimit, resetRateLimitState, validateInput } from '@/lib/rateLimiter'

describe('escapeHtml', () => {
  it('escapes script tags', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes ampersands without double-encoding a raw ampersand', () => {
    expect(escapeHtml('&')).toBe('&amp;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
  })
})

describe('sanitizeInput', () => {
  it('strips ANSI escape codes and control characters', () => {
    expect(sanitizeInput('\x1b[31mhello\x1b[0m\x00world')).toBe('helloworld')
  })

  it('preserves tabs and newlines while normalizing carriage returns', () => {
    expect(sanitizeInput('one\r\ntwo\tthree')).toBe('one\ntwo\tthree')
  })
})

describe('highlightLog security behavior', () => {
  it('never emits raw script tags in highlighted output', () => {
    const output = highlightLog('<script>alert("xss")</script>')
    expect(output).not.toContain('<script>')
    expect(output).toContain('&lt;script&gt;')
  })
})

describe('validateInput', () => {
  it('rejects empty input', () => {
    const result = validateInput('')
    expect(result.ok).toBe(false)
  })

  it('rejects input larger than 500001 characters', () => {
    const result = validateInput('a'.repeat(500_001))
    expect(result.ok).toBe(false)
  })

  it('rejects null bytes', () => {
    const result = validateInput('hello\x00world')
    expect(result.ok).toBe(false)
  })

  it('accepts normal log input', () => {
    const result = validateInput('2024-01-15 ERROR user_id=42')
    expect(result.ok).toBe(true)
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitState()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first processing run', () => {
    expect(checkRateLimit()).toEqual({ allowed: true })
  })

  it('blocks a second run that is too soon', () => {
    expect(checkRateLimit()).toEqual({ allowed: true })
    vi.setSystemTime(new Date('2026-04-09T10:00:00.100Z'))
    const result = checkRateLimit()

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0)
    }
  })
})
