import { describe, expect, it } from 'vitest'
import { escapeHtml, highlightLog, highlightLogSync, sanitizeInput } from '@/lib/highlighter'

describe('escapeHtml', () => {
  it('escapes script tags', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('&')).toBe('&amp;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
  })

  it('escapes apostrophes with numeric entity', () => {
    expect(escapeHtml("'")).toBe('&#39;')
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
    const output = highlightLogSync('<script>alert("xss")</script>')
    expect(output).not.toContain('<script>')
    expect(output).toContain('&lt;script&gt;')
  })
})

describe('highlightLog token classes', () => {
  it('wraps ERROR in level-error span', () => {
    const out = highlightLogSync('ERROR boom')
    expect(out).toContain('token-level-error')
  })

  it('wraps IPv4 in token-ip', () => {
    const out = highlightLogSync('ping 192.168.0.1 done')
    expect(out).toContain('token-ip')
  })

  it('escapes angle brackets in user text while still wrapping safe tokens', () => {
    const out = highlightLogSync('192.168.0.1 <x>')
    expect(out).toContain('&lt;x&gt;')
    expect(out).toContain('token-ip')
  })

  it('prioritises timestamp over number when overlapping', () => {
    const out = highlightLogSync('2024-01-15T10:00:00Z')
    expect(out).toContain('token-timestamp')
  })
})

describe('ReDoS safety (per-line budget)', () => {
  const run = (input: string): void => {
    const start = performance.now()
    highlightLogSync(input)
    const ms = performance.now() - start
    expect(ms).toBeLessThan(100)
  }

  it('handles 10k repeated a characters', () => {
    run('a'.repeat(10_000))
  })

  it('handles 10k unterminated double-quoted string', () => {
    run(`"${'a'.repeat(10_000)}`)
  })

  it('handles 1000 equals signs', () => {
    run('='.repeat(1000))
  })

  it('handles 1000 slashes', () => {
    run('/'.repeat(1000))
  })
})
