import { describe, expect, it } from 'vitest'
import { highlightLogSync, sanitizeInput } from '@/lib/highlighter'

describe('highlightLogSync', () => {
  it('returns empty string for empty input', () => {
    expect(highlightLogSync('')).toBe('')
  })

  it('wraps each line in log-line div and empty line uses nbsp', () => {
    const html = highlightLogSync('a\n\nb')
    expect(html).toContain('<div class="log-line">')
    expect(html).toContain('&nbsp;')
  })

  it('normalizes CRLF', () => {
    const html = highlightLogSync('x\r\ny')
    expect(html.split('log-line').length).toBeGreaterThanOrEqual(3)
  })

  it('marks HTTP status and IP in nginx-style line', () => {
    const line = '192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234'
    const html = highlightLogSync(line)
    expect(html).toContain('token-ip')
    expect(html).toContain('token-status-2xx')
    expect(html).toContain('token-http-method')
  })

  it('marks UUID distinctly', () => {
    const html = highlightLogSync('550e8400-e29b-41d4-a716-446655440000')
    expect(html).toContain('token-uuid')
  })

  it('marks ERROR in red class', () => {
    const html = highlightLogSync('ERROR something')
    expect(html).toContain('token-level-error')
  })

  it('marks WARN', () => {
    const html = highlightLogSync('WARNING: x')
    expect(html).toContain('token-level-warn')
  })
})

describe('priority', () => {
  it('timestamp wins over epoch-looking substrings when full ISO present', () => {
    const html = highlightLogSync('2024-01-15T10:00:00Z')
    expect(html).toContain('token-timestamp')
  })
})
