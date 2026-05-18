import { describe, expect, it } from 'vitest'
import { highlightLine, highlightLogAsync, highlightLogSync } from '@/lib/highlighter'

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

  it('marks bracketed ERROR and INFO levels', () => {
    expect(highlightLogSync('[ERROR] boom')).toContain('token-level-error')
    expect(highlightLogSync('INFO: started')).toContain('token-level-info')
    expect(highlightLogSync('DEBUG trace')).toContain('token-level-debug')
  })
})

describe('priority', () => {
  it('timestamp wins over epoch-looking substrings when full ISO present', () => {
    const html = highlightLogSync('2024-01-15T10:00:00Z')
    expect(html).toContain('token-timestamp')
  })
})

describe('token type coverage', () => {
  it('HTTP status buckets', () => {
    expect(highlightLogSync('x 502 y')).toContain('token-status-5xx')
    expect(highlightLogSync('x 404 y')).toContain('token-status-4xx')
    expect(highlightLogSync('x 302 y')).toContain('token-status-3xx')
  })

  it('URL token', () => {
    expect(highlightLogSync('see https://example.com/path?q=1 ok')).toContain('token-url')
  })

  it('Unix path', () => {
    expect(highlightLogSync('tail /var/log/sys.log')).toContain('token-path')
  })

  it('key=value pair', () => {
    const html = highlightLogSync('region=us-east-1')
    expect(html).toContain('token-key')
    expect(html).toContain('token-value')
  })

  it('JSON key on valid JSON line', () => {
    expect(highlightLogSync('{"trace_id":"abc"}')).toContain('token-json-key')
  })

  it('standalone number', () => {
    expect(highlightLogSync('count 42 done')).toContain('token-number')
  })

  it('boolean and null literals', () => {
    const html = highlightLogSync('ok true false null nil undefined')
    expect(html).toContain('token-literal')
  })
})

describe('HTML escaping and XSS-safe output', () => {
  it('does not emit raw angle brackets from user input', () => {
    const malicious = '<script>alert(1)</script>'
    const html = highlightLogSync(malicious)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;')
    expect(html).toContain('&gt;')
  })

  it('escapes ampersands and quotes in plain segments', () => {
    const html = highlightLogSync('AT&T "x" \'y\'')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
    expect(html).toContain('&#39;')
  })
})

describe('adversarial inputs (timing)', () => {
  it('highlights 10k repeated letters within PRD §11.1 budget', () => {
    const line = 'a'.repeat(10_000)
    const t0 = performance.now()
    const out = highlightLine(line)
    expect(performance.now() - t0).toBeLessThan(100)
    expect(out.length).toBeGreaterThan(0)
    expect(out).not.toContain('<script')
  })

  it('10k letters with few token matches completes within PRD budget', () => {
    const line = 'z'.repeat(10_000)
    const t0 = performance.now()
    highlightLine(line)
    expect(performance.now() - t0).toBeLessThan(100)
  })

  it('handles long unterminated double-quote without hanging', () => {
    const line = `"${'b'.repeat(10_000)}`
    const t0 = performance.now()
    const out = highlightLine(line)
    expect(performance.now() - t0).toBeLessThan(100)
    expect(out).toContain('&quot;')
  })

  it('handles many equals signs in one line without hanging', () => {
    const line = '='.repeat(1000)
    const t0 = performance.now()
    highlightLine(line)
    expect(performance.now() - t0).toBeLessThan(100)
  })

  it('handles many slashes in one line without hanging', () => {
    const line = `/${'/'.repeat(999)}`
    const t0 = performance.now()
    highlightLine(line)
    expect(performance.now() - t0).toBeLessThan(100)
  })

  it('closed quoted payload with 10k inner chars completes within PRD §18 budget', () => {
    const line = `"${'a'.repeat(10_000)}"`
    const t0 = performance.now()
    highlightLogSync(line)
    expect(performance.now() - t0).toBeLessThan(2000)
  })

  it('chunked highlight completes for many lines', async () => {
    const lines = 6000
    const body = Array.from({ length: lines }, (_, i) => `LINE ${i} INFO ok`).join('\n')
    const t0 = performance.now()
    const html = await highlightLogAsync(body)
    expect(performance.now() - t0).toBeLessThan(30_000)
    expect(html.split('log-line').length).toBeGreaterThan(lines)
  })
})
