import { describe, expect, it } from 'vitest'
import { HIGHLIGHT_GROUPS, highlightLog, highlightLogWithStats } from '@/lib/highlighter'

const CYAN = 'color: #36c4c4'
const MAGENTA = 'color: #c51e8a'
const BLUE = 'color: #2aa1d3'
const GREEN = 'color: #6eb56c'
const RED = 'color: #dc4b4b'
const YELLOW = 'color: #f0d42a'

describe('highlightLog', () => {
  it('returns an empty string for empty input', () => {
    expect(highlightLog('')).toBe('')
  })

  it('normalizes CRLF line endings', () => {
    const output = highlightLog('line one\r\nline two')
    expect(output).not.toContain('\r')
    expect(output.split('\n')).toHaveLength(2)
  })

  it('strips ANSI escape codes', () => {
    const output = highlightLog('\x1b[31mERROR\x1b[0m message')
    expect(output).toContain('ERROR')
    expect(output).not.toContain('\x1b')
  })

  it('escapes script tags before injecting spans', () => {
    const output = highlightLog('<script>alert("xss")</script>')
    expect(output).toContain('&lt;script&gt;')
    expect(output).toContain('&lt;/script&gt;')
    expect(output).not.toContain('<script>')
  })

  it('highlights ISO dates and datetimes', () => {
    expect(highlightLog('2024-01-15')).toContain(MAGENTA)
    const output = highlightLog('2024-01-15T10:23:45.123Z')
    expect(output).toContain(MAGENTA)
    expect(output).toContain(BLUE)
    expect(output).toContain(RED)
  })

  it('highlights nginx and syslog timestamps', () => {
    expect(highlightLog('15/Jan/2024:10:23:45 +0000')).toContain(MAGENTA)
    expect(highlightLog('Jan 15 10:23:45')).toContain(BLUE)
  })

  it('highlights time-only values', () => {
    expect(highlightLog('10:23:45')).toContain(BLUE)
  })

  it('highlights null and true but not embedded keyword text', () => {
    expect(highlightLog('null')).toContain(RED)
    expect(highlightLog('true')).toContain(GREEN)
    expect(highlightLog('nullify')).not.toContain(RED)
    expect(highlightLog('truecolor')).not.toContain(GREEN)
    expect(highlightLog('FORGET')).not.toContain('background-color: #50fa7b')
  })

  it('highlights full HTTP and HTTPS URLs including query parameters', () => {
    const output = highlightLog('https://api.example.com/v1/users?page=1&sort=desc')
    expect(output).toContain(GREEN)
    expect(output).toContain(BLUE)
    expect(output).toContain(MAGENTA)
    expect(output).toContain(CYAN)

    expect(highlightLog('http://localhost:3000/health')).toContain(BLUE)
  })

  it('does not treat ftp URLs as http URLs', () => {
    const output = highlightLog('ftp://files.example.com')
    expect(output).toBe('ftp://files.example.com')
  })

  it('highlights standalone numbers but not numbers embedded in words or versions', () => {
    expect(highlightLog('timeout after 30 seconds')).toContain(CYAN)
    expect(highlightLog('3.14 req/s')).toContain(CYAN)
    expect(highlightLog('base64encoded')).not.toContain(CYAN)
    expect(highlightLog('md5hash')).not.toContain(CYAN)
    expect(highlightLog('0x1F')).not.toContain(CYAN)
    expect(highlightLog('v1.2.3')).not.toContain(CYAN)
  })

  it('highlights valid IPv4 addresses and rejects invalid or zero-padded ones', () => {
    expect(highlightLog('192.168.1.1')).toContain(BLUE)
    expect(highlightLog('0.0.0.0')).toContain(BLUE)
    expect(highlightLog('255.255.255.255')).toContain(BLUE)
    expect(highlightLog('256.1.1.1')).not.toContain(BLUE)
    expect(highlightLog('999.0.0.1')).not.toContain(BLUE)
    expect(highlightLog('192.168.001.001')).not.toContain(BLUE)
    expect(highlightLog('1.2.3.4.5')).not.toContain(BLUE)
  })

  it('highlights valid UUIDs and ignores invalid UUID-like strings', () => {
    expect(highlightLog('550e8400-e29b-41d4-a716-446655440000')).toContain(BLUE)
    expect(highlightLog('550E8400-E29B-41D4-A716-446655440000')).toContain(MAGENTA)
    expect(highlightLog('550e8400-e29b-41d4-a716')).not.toContain(BLUE)
    expect(highlightLog('not-a-uuid-at-all')).not.toContain(MAGENTA)
  })

  it('highlights quoted strings and unix-like paths', () => {
    expect(highlightLog('"quoted text"')).toContain(YELLOW)
    const output = highlightLog('GET /api/users/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1')
    expect(output).toContain(YELLOW)
    expect(output).toContain(GREEN)
    expect(output).not.toContain('<span style="color: #6eb56c; font-style: italic"><span')
  })

  it('highlights HTTP status codes after generic numbers', () => {
    expect(highlightLog('HTTP/1.1 200 OK')).toContain(GREEN)
    expect(highlightLog('404 Not Found')).toContain(RED)
    expect(highlightLog('500 Internal Server Error')).toContain('font-weight: bold')
  })

  it('keeps JSON keys highlighted on valid JSON lines', () => {
    expect(highlightLog('{"name":"Ada","active":true}')).toContain(YELLOW)
  })

  it('skips expensive highlighting for very long lines quickly', () => {
    const longLine = 'a'.repeat(5001)
    const startedAt = performance.now()
    const output = highlightLog(longLine)
    const elapsed = performance.now() - startedAt

    expect(output).toContain('a')
    expect(elapsed).toBeLessThan(100)
  })
})

describe('highlightLogWithStats', () => {
  it('returns highlighted html and processing stats', () => {
    const result = highlightLogWithStats('2024-01-15 ERROR user_id=42')
    expect(result.html).toContain(MAGENTA)
    expect(result.stats.linesProcessed).toBe(1)
    expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0)
  })
})

describe('HIGHLIGHT_GROUPS', () => {
  it('exports every configured group', () => {
    expect(HIGHLIGHT_GROUPS.map(group => group.name)).toEqual([
      'dates',
      'keywords',
      'urls',
      'numbers',
      'ipv4',
      'quotes',
      'paths',
      'uuids',
      'keyValue',
      'statusCodes',
      'json',
    ])
  })
})
