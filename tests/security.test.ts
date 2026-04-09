import { describe, it, expect, vi } from 'vitest'
import { sanitizeInput, highlightLog } from '../lib/highlighter'
import { validateInput, checkRateLimit } from '../lib/rateLimiter'

// ─── XSS Prevention Tests ────────────────────────────────────────────────────

describe('XSS prevention', () => {
  it('escapes script tags in input', () => {
    const output = highlightLog('<script>alert("xss")</script>')
    expect(output).not.toContain('<script>')
    expect(output).toContain('&lt;script&gt;')
  })

  it('escapes img onerror payloads', () => {
    const output = highlightLog('<img src=x onerror=alert(1)>')
    expect(output).not.toContain('<img')
    expect(output).toContain('&lt;img')
  })

  it('escapes event handler attributes', () => {
    const output = highlightLog('<div onclick="alert(1)">click me</div>')
    expect(output).not.toContain('<div')
    expect(output).toContain('&lt;div')
  })

  it('escapes javascript: URI scheme', () => {
    const output = highlightLog('javascript:alert(1)')
    expect(output).not.toContain('javascript:alert')
  })

  it('escapes SVG-based XSS', () => {
    const output = highlightLog('<svg onload=alert(1)>')
    expect(output).not.toContain('<svg')
    expect(output).toContain('&lt;svg')
  })

  it('escapes template literal injection', () => {
    const output = highlightLog('${alert(1)}')
    expect(output).toContain('$')
    expect(output).not.toContain('<script>')
  })

  it('escapes HTML entities correctly without double-encoding', () => {
    const output = highlightLog('&amp; &lt; &gt;')
    expect(output).toContain('&amp;amp;')
    expect(output).toContain('&amp;lt;')
  })

  it('preserves normal log content after escaping', () => {
    const output = highlightLog('2024-01-15 10:23:45 ERROR some message here 42')
    expect(output).toContain('2024')
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('onerror')
  })
})

// ─── Input Sanitization Tests ────────────────────────────────────────────────

describe('input sanitization', () => {
  it('strips ANSI escape codes', () => {
    const result = sanitizeInput('\x1b[32mHello\x1b[0m World')
    expect(result).toBe('Hello World')
    expect(result).not.toContain('\x1b')
  })

  it('strips ANSI codes with multiple parameters', () => {
    const result = sanitizeInput('\x1b[1;31mERROR\x1b[0m')
    expect(result).toBe('ERROR')
  })

  it('normalizes Windows line endings', () => {
    const result = sanitizeInput('line one\r\nline two\r\n')
    expect(result).toBe('line one\nline two\n')
    expect(result).not.toContain('\r')
  })

  it('normalizes standalone carriage returns', () => {
    const result = sanitizeInput('line one\rline two')
    expect(result).not.toContain('\r')
  })

  it('strips null bytes', () => {
    const result = sanitizeInput('hello\x00world')
    expect(result).not.toContain('\x00')
    expect(result).toBe('helloworld')
  })

  it('strips other control characters but preserves newlines and tabs', () => {
    const result = sanitizeInput('hello\x07\x08world\ttab\nnewline')
    expect(result).toContain('helloworld')
    expect(result).toContain('\t')
    expect(result).toContain('\n')
    expect(result).not.toContain('\x07')
    expect(result).not.toContain('\x08')
  })

  it('handles empty string without error', () => {
    expect(() => sanitizeInput('')).not.toThrow()
    expect(sanitizeInput('')).toBe('')
  })

  it('handles unicode without stripping it', () => {
    const result = sanitizeInput('hello 日本語 emoji 🎉')
    expect(result).toContain('日本語')
    expect(result).toContain('🎉')
  })
})

// ─── Input Validation Tests ──────────────────────────────────────────────────

describe('input validation — size limits', () => {
  it('accepts input within size limit', () => {
    const input = 'normal log line\n'.repeat(100)
    const result = validateInput(input)
    expect(result.ok).toBe(true)
  })

  it('rejects input exceeding byte limit', () => {
    const input = 'a'.repeat(500_001)
    const result = validateInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('Input too large')
    }
  })

  it('rejects input with too many lines', () => {
    const input = 'line\n'.repeat(50_001)
    const result = validateInput(input)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('Too many lines')
    }
  })

  it('rejects input containing null bytes', () => {
    const result = validateInput('hello\x00world')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('Invalid input')
    }
  })

  it('rejects input with ReDoS-style repeated patterns', () => {
    const result = validateInput('a'.repeat(10_001))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('Invalid input')
    }
  })

  it('accepts exactly at the line limit', () => {
    // Note: 'line\n'.repeat(n) creates n+1 lines when split by \n due to trailing newline
    // 49,999 \n characters = 50,000 lines, which is exactly at the limit
    const input = 'line\n'.repeat(49_999)
    const result = validateInput(input)
    expect(result.ok).toBe(true)
  })
})

// ─── Rate Limiting Tests ─────────────────────────────────────────────────────

describe('rate limiting', () => {
  it('allows a single processing run', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 15_000)

    const result = checkRateLimit()
    expect(result.allowed).toBe(true)

    vi.useRealTimers()
  })

  it('blocks runs that are too close together', () => {
    vi.useFakeTimers()
    const start = Date.now() + 30_000
    vi.setSystemTime(start)

    checkRateLimit()

    vi.setSystemTime(start + 100)
    const result = checkRateLimit()
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0)
    }

    vi.useRealTimers()
  })

  it('allows run after debounce period', () => {
    vi.useFakeTimers()
    const start = Date.now() + 45_000
    vi.setSystemTime(start)

    checkRateLimit()

    vi.setSystemTime(start + 400)
    const result = checkRateLimit()
    expect(result.allowed).toBe(true)

    vi.useRealTimers()
  })
})

// ─── ReDoS Protection Tests ──────────────────────────────────────────────────

describe('ReDoS protection', () => {
  it('processes a 5001 character line without hanging', () => {
    const longLine = 'a'.repeat(5001)
    const start = performance.now()
    const output = highlightLog(longLine)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
    expect(output).toContain('a')
  })

  it('processes adversarial regex input within time limit', () => {
    const adversarial = 'a'.repeat(30) + '@' + 'a'.repeat(30) + '!'
    const start = performance.now()
    highlightLog(adversarial)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
  })

  it('processes 10000 normal lines within 3 seconds', () => {
    const input = Array(10_000)
      .fill('2024-01-15 10:23:45 INFO user_id=42 GET /api/users 200 192.168.1.1')
      .join('\n')
    const start = performance.now()
    highlightLog(input)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(3000)
  })
})