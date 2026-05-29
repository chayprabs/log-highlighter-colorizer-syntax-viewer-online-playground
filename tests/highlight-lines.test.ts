import { describe, expect, it } from 'vitest'
import { highlightLine, highlightLinesSync } from '@/lib/highlighter'

describe('highlightLinesSync (production path)', () => {
  it('returns empty for empty input', () => {
    expect(highlightLinesSync('')).toEqual([])
  })

  it('highlights nginx timestamp', () => {
    const line = '192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api HTTP/1.1" 200'
    const html = highlightLinesSync(line)[0] ?? ''
    expect(html).toContain('gs-t-timestamp')
    expect(html).toContain('gs-t-ip')
    expect(html).toContain('gs-t-status-2xx')
  })

  it('strips ANSI before highlighting', () => {
    const html = highlightLinesSync('\x1b[31mERROR\x1b[0m fail')[0] ?? ''
    expect(html).not.toContain('\x1b')
    expect(html).toContain('gs-t-error')
  })

  it('respects disabled token filters', () => {
    const html = highlightLine('ERROR warn', new Set<import('@/lib/urlState').TokenId>(['level-warn']))
    expect(html).not.toContain('gs-t-error')
    expect(html).toContain('gs-t-warn')
  })
})
