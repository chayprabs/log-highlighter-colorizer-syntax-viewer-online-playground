import { describe, it, expect } from 'vitest'
import { highlightLog, HIGHLIGHT_GROUPS, highlightLogWithStats } from '@/lib/highlighter'

const MAGENTA = 'color: #c51e8a'
const BLUE = 'color: #2aa1d3'
const RED = 'color: #dc4b4b'
const GREEN = 'color: #6eb56c'
const YELLOW = 'color: #f0d42a'
const CYAN = 'color: #36c4c4'
const WHITE = 'color: #f8f8f2'
const FAINT = 'opacity: 0.6'

function containsStyle(html: string, style: string): boolean {
  return html.includes(style)
}

describe('1. Dates', () => {
  it('highlights ISO date in magenta', () => {
    const result = highlightLog('2024-01-15')
    expect(containsStyle(result, MAGENTA)).toBe(true)
  })

  it('highlights time in blue', () => {
    const result = highlightLog('15:04:05')
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('highlights timezone Z in red when part of timestamp', () => {
    const result = highlightLog('15:04:05Z')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights full timestamp with all components', () => {
    const result = highlightLog('2024-01-15 15:04:05Z')
    expect(containsStyle(result, MAGENTA)).toBe(true)
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights dates with slashes', () => {
    const result = highlightLog('2024/01/15')
    expect(containsStyle(result, MAGENTA)).toBe(true)
  })

  it('highlights timezone with offset when part of timestamp', () => {
    const result = highlightLog('15:04:05+05:30')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights fractional seconds', () => {
    const result = highlightLog('15:04:05.123')
    expect(containsStyle(result, BLUE)).toBe(true)
  })
})

describe('2. Keywords', () => {
  it('highlights null in red', () => {
    const result = highlightLog('null')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights false in red italic', () => {
    const result = highlightLog('false')
    expect(containsStyle(result, RED)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights true in green italic', () => {
    const result = highlightLog('true')
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights GET with green background', () => {
    const result = highlightLog('GET')
    expect(containsStyle(result, 'background-color: #50fa7b')).toBe(true)
  })

  it('highlights POST with yellow background', () => {
    const result = highlightLog('POST')
    expect(containsStyle(result, 'background-color: #f1fa8c')).toBe(true)
  })

  it('highlights PUT with magenta background', () => {
    const result = highlightLog('PUT')
    expect(containsStyle(result, 'background-color: #ff79c6')).toBe(true)
  })

  it('highlights DELETE with red background', () => {
    const result = highlightLog('DELETE')
    expect(containsStyle(result, 'background-color: #ff5555')).toBe(true)
  })

  it('highlights PATCH with magenta background', () => {
    const result = highlightLog('PATCH')
    expect(containsStyle(result, 'background-color: #ff79c6')).toBe(true)
  })

  it('highlights HEAD with blue background', () => {
    const result = highlightLog('HEAD')
    expect(containsStyle(result, 'background-color: #8be9fd')).toBe(true)
  })

  it('highlights ERROR in red', () => {
    const result = highlightLog('ERROR')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights WARN in yellow', () => {
    const result = highlightLog('WARN')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights INFO in white', () => {
    const result = highlightLog('INFO')
    expect(containsStyle(result, WHITE)).toBe(true)
  })

  it('highlights DEBUG in green', () => {
    const result = highlightLog('DEBUG')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights mixed keywords', () => {
    const result = highlightLog('null true false GET POST')
    expect(containsStyle(result, RED)).toBe(true)
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, 'background-color: #50fa7b')).toBe(true)
    expect(containsStyle(result, 'background-color: #f1fa8c')).toBe(true)
  })
})

describe('3. URLs', () => {
  it('highlights https protocol in green', () => {
    const result = highlightLog('https://example.com')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights http protocol in red', () => {
    const result = highlightLog('http://example.com')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights URL host in blue', () => {
    const result = highlightLog('https://api.example.com')
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('highlights URL path in blue', () => {
    const result = highlightLog('https://api.example.com/v1/users')
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('highlights query parameter key in magenta', () => {
    const result = highlightLog('https://api.example.com?page=1')
    expect(containsStyle(result, MAGENTA)).toBe(true)
  })

  it('highlights query parameter value in cyan', () => {
    const result = highlightLog('https://api.example.com?page=1')
    expect(containsStyle(result, CYAN)).toBe(true)
  })

  it('highlights full URL with all components', () => {
    const result = highlightLog('https://api.example.com/v1/users')
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, BLUE)).toBe(true)
  })
})

describe('4. Numbers', () => {
  it('highlights integers in cyan', () => {
    const result = highlightLog('30')
    expect(containsStyle(result, CYAN)).toBe(true)
  })

  it('highlights decimals in cyan', () => {
    const result = highlightLog('3.14159')
    expect(containsStyle(result, CYAN)).toBe(true)
  })

  it('highlights numbers in context', () => {
    const result = highlightLog('Connection timeout after 30 retries')
    expect(containsStyle(result, CYAN)).toBe(true)
  })

  it('highlights multiple numbers', () => {
    const result = highlightLog('123 456 789')
    expect(result.split(CYAN).length - 1).toBeGreaterThan(1)
  })
})

describe('5. IPv4', () => {
  it('highlights valid IPv4 octets in blue italic', () => {
    const result = highlightLog('192.168.1.1')
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights dots in red', () => {
    const result = highlightLog('192.168.1.1')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('does NOT highlight invalid octets (999)', () => {
    const result = highlightLog('999.999.999.999')
    const blueCount = (result.match(/color: #2aa1d3/g) || []).length
    expect(blueCount).toBe(0)
  })

  it('does NOT highlight 256 octets', () => {
    const result = highlightLog('256.1.1.1')
    const blueCount = (result.match(/color: #2aa1d3/g) || []).length
    expect(blueCount).toBe(0)
  })

  it('highlights CIDR notation', () => {
    const result = highlightLog('192.168.1.1/24')
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('highlights IP in context', () => {
    const result = highlightLog('Request from 192.168.1.1')
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('validates each octet is 0-255', () => {
    const result = highlightLog('192.168.1.255')
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, RED)).toBe(true)
  })
})

describe('6. Quotes', () => {
  it('highlights double-quoted text in yellow', () => {
    const result = highlightLog('"file not found"')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights quoted text in context', () => {
    const result = highlightLog('Error message: "file not found"')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights multiple quoted strings', () => {
    const result = highlightLog('"hello" and "world"')
    const yellowCount = (result.match(/color: #f0d42a/g) || []).length
    expect(yellowCount).toBeGreaterThan(1)
  })

  it('handles empty quotes', () => {
    const result = highlightLog('before "" after')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('handles odd number of quotes (no highlight)', () => {
    const result = highlightLog('"hello')
    const yellowCount = (result.match(/color: #f0d42a/g) || []).length
    expect(yellowCount).toBe(0)
  })
})

describe('7. Unix Paths', () => {
  it('highlights path segments in green italic', () => {
    const result = highlightLog('/var/log')
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights slashes in yellow', () => {
    const result = highlightLog('/var/log')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights absolute paths', () => {
    const result = highlightLog('/var/log/nginx/access.log')
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights relative paths', () => {
    const result = highlightLog('./config/settings.json')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights home directory paths', () => {
    const result = highlightLog('~/projects/app')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights paths in context', () => {
    const result = highlightLog('Config file not found at /etc/app/config.yml')
    expect(containsStyle(result, GREEN)).toBe(true)
  })
})

describe('8. UUIDs', () => {
  it('highlights UUID numbers in blue italic', () => {
    const result = highlightLog('550e8400-e29b-41d4-a716-446655440000')
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights UUID letters in magenta italic', () => {
    const result = highlightLog('550e8400-e29b-41d4-a716-446655440000')
    expect(containsStyle(result, MAGENTA)).toBe(true)
    expect(containsStyle(result, 'font-style: italic')).toBe(true)
  })

  it('highlights UUID dashes in red', () => {
    const result = highlightLog('550e8400-e29b-41d4-a716-446655440000')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights UUID in context', () => {
    const result = highlightLog('User 550e8400-e29b-41d4-a716-446655440000 logged in')
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, MAGENTA)).toBe(true)
  })
})

describe('9. Key-Value Pairs', () => {
  it('highlights keys in faint white', () => {
    const result = highlightLog('user_id=42')
    expect(containsStyle(result, WHITE)).toBe(true)
    expect(containsStyle(result, FAINT)).toBe(true)
  })

  it('highlights equals sign in white', () => {
    const result = highlightLog('user_id=42')
    expect(containsStyle(result, WHITE)).toBe(true)
  })

  it('highlights multiple key-value pairs', () => {
    const result = highlightLog('user_id=42 status=active')
    expect(containsStyle(result, WHITE)).toBe(true)
  })

  it('highlights key:value format', () => {
    const result = highlightLog('status: pending')
    expect(containsStyle(result, WHITE)).toBe(true)
  })

  it('highlights key-value in context', () => {
    const result = highlightLog('user_id=42 status=active')
    const whiteCount = (result.match(/color: #f8f8f2/g) || []).length
    expect(whiteCount).toBeGreaterThanOrEqual(4)
  })
})

describe('10. HTTP Status Codes', () => {
  it('highlights 200 in green', () => {
    const result = highlightLog('200 OK')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights 201 in green', () => {
    const result = highlightLog('201 Created')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights 204 in green', () => {
    const result = highlightLog('204 No Content')
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights 301 in yellow', () => {
    const result = highlightLog('301 Redirect')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights 404 in red', () => {
    const result = highlightLog('404 Not Found')
    expect(containsStyle(result, RED)).toBe(true)
  })

  it('highlights 500 in red bold', () => {
    const result = highlightLog('500 Internal Server Error')
    expect(containsStyle(result, RED)).toBe(true)
    expect(containsStyle(result, 'font-weight: bold')).toBe(true)
  })

  it('highlights 503 in red bold', () => {
    const result = highlightLog('503 Service Unavailable')
    expect(containsStyle(result, RED)).toBe(true)
    expect(containsStyle(result, 'font-weight: bold')).toBe(true)
  })

  it('highlights 401 in red', () => {
    const result = highlightLog('401 Unauthorized')
    expect(containsStyle(result, RED)).toBe(true)
  })
})

describe('11. JSON', () => {
  it('highlights JSON keys in yellow', () => {
    const result = highlightLog('{"key": "value"}')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights multiple JSON keys', () => {
    const result = highlightLog('{"name": "John", "age": 30}')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights quoted text in non-JSON lines (quotes highlighter)', () => {
    const result = highlightLog('This is not JSON: {"key"}')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights quoted text in JSON arrays (quotes highlighter)', () => {
    const result = highlightLog('["first", "second"]')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('highlights nested JSON keys', () => {
    const result = highlightLog('{"user": {"name": "John"}}')
    expect(containsStyle(result, YELLOW)).toBe(true)
  })

  it('handles mixed JSON and non-JSON lines', () => {
    const result = highlightLog('Not JSON\n{"key": "value"}\nAlso not JSON')
    const yellowCount = (result.match(/color: #f0d42a/g) || []).length
    expect(yellowCount).toBeGreaterThan(0)
  })
})

describe('Edge Cases', () => {
  it('handles empty input', () => {
    const result = highlightLog('')
    expect(result).toBe('')
  })

  it('handles newlines only', () => {
    const result = highlightLog('\n\n\n')
    expect(result).toBe('\n\n\n')
  })

  it('handles very long lines', () => {
    const longLine = 'x'.repeat(10000)
    const result = highlightLog(longLine)
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('processes multiple lines', () => {
    const result = highlightLog('Line 1\nLine 2\nLine 3')
    expect(result.split('\n').length).toBe(3)
  })

  it('escapes HTML characters in input', () => {
    const result = highlightLog('<script>alert("xss")</script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<script>')
  })

  it('preserves line order', () => {
    const input = '2024-01-15 15:04:05\n192.168.1.1\n"quoted"'
    const result = highlightLog(input)
    const lines = result.split('\n')
    expect(lines.length).toBe(3)
  })

  it('handles overlapping highlight patterns correctly', () => {
    const result = highlightLog('GET /api 200')
    expect(containsStyle(result, 'background-color: #50fa7b')).toBe(true)
    expect(containsStyle(result, GREEN)).toBe(true)
  })
})

describe('Nginx Log Sample', () => {
  it('highlights IP addresses in nginx log', () => {
    const log = '192.168.1.100 - - [15/Jan/2024:10:23:45 +0000] "GET /api/v1/users HTTP/1.1" 200 1234'
    const result = highlightLog(log)
    expect(containsStyle(result, BLUE)).toBe(true)
  })

  it('highlights HTTP methods in nginx log', () => {
    const log = '"GET /api/v1/users HTTP/1.1"'
    const result = highlightLog(log)
    expect(containsStyle(result, 'background-color: #50fa7b')).toBe(true)
  })

  it('highlights status codes in nginx log', () => {
    const log = '"GET /api/v1/users HTTP/1.1" 200'
    const result = highlightLog(log)
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights URLs in nginx log', () => {
    const log = '"GET /api/v1/users HTTP/1.1"'
    const result = highlightLog(log)
    expect(containsStyle(result, GREEN)).toBe(true)
  })

  it('highlights UUID in nginx DELETE request', () => {
    const log = 'DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000'
    const result = highlightLog(log)
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, MAGENTA)).toBe(true)
  })

  it('highlights full nginx log line correctly', () => {
    const log = '192.168.1.100 - - [15/Jan/2024:10:23:45 +0000] "GET /api/v1/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"'
    const result = highlightLog(log)
    expect(containsStyle(result, BLUE)).toBe(true)
    expect(containsStyle(result, GREEN)).toBe(true)
    expect(containsStyle(result, 'background-color: #50fa7b')).toBe(true)
  })
})

describe('Additional Date Formats', () => {
  it('highlights nginx date format [15/Jan/2024:10:23:45 +0000]', () => {
    const result = highlightLog('[15/Jan/2024:10:23:45 +0000]')
    console.log('Nginx result:', result)
    expect(result).toContain('color: #c51e8a')
  })

  it('highlights plain date format Jan 15 10:23:45', () => {
    const result = highlightLog('Jan 15 10:23:45')
    console.log('Plain date result:', result)
    expect(result).toContain('color: #c51e8a')
  })

  it('highlights nginx date in full nginx log line', () => {
    const log = '192.168.1.100 - - [15/Jan/2024:10:23:45 +0000] "GET /api/v1/users HTTP/1.1" 200 1234'
    const result = highlightLog(log)
    console.log('Nginx log result:', result)
    expect(result).toContain('color: #c51e8a')
  })
})

describe('Windows Line Endings', () => {
  it('normalizes Windows CRLF to LF', () => {
    const result = highlightLog('line one\r\nline two\r\n')
    expect(result).not.toContain('\r')
    expect(result).toContain('line one')
    expect(result).toContain('line two')
  })

  it('handles mixed CRLF and LF', () => {
    const result = highlightLog('line one\r\nline two\nline three')
    expect(result).not.toContain('\r')
  })

  it('does not show visible carriage return character', () => {
    const result = highlightLog('first\r\nsecond')
    expect(result).not.toMatch(/\r/)
  })
})

describe('ANSI Escape Codes', () => {
  it('strips ANSI color codes', () => {
    const input = '\x1b[31mError message\x1b[0m'
    const result = highlightLog(input)
    expect(result).not.toContain('\x1b')
    expect(result).toContain('Error message')
  })

  it('strips ANSI bold codes', () => {
    const input = '\x1b[1mBold text\x1b[0m'
    const result = highlightLog(input)
    expect(result).not.toContain('\x1b')
    expect(result).toContain('Bold text')
  })

  it('strips multiple ANSI codes in sequence', () => {
    const input = '\x1b[31;1mRed Bold\x1b[0m'
    const result = highlightLog(input)
    expect(result).not.toContain('\x1b')
    expect(result).toContain('Red Bold')
  })
})

describe('Single Quote Escaping', () => {
  it('escapes single quotes in input', () => {
    const result = highlightLog("it's a test")
    expect(result).toMatch(/&#(?:39|x27);/)
  })

  it('handles XSS with single quotes', () => {
    const result = highlightLog("<script>alert('xss')</script>")
    expect(result).toMatch(/&#(?:39|x27);/)
    expect(result).not.toContain("alert('xss')")
  })
})

describe('Performance Tests', () => {
  it('processes 50,000 character line in under 500ms', () => {
    const longLine = 'GET /api/users HTTP/1.1 200 '.repeat(1000) + '192.168.1.1 '.repeat(500)
    const start = performance.now()
    const result = highlightLog(longLine)
    const elapsed = performance.now() - start
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(500)
  })

  it('processes 10,000 lines in under 2000ms', () => {
    const manyLines = Array(10000).fill('2024-01-15 10:23:45 INFO user_id=42 status=active').join('\n')
    const start = performance.now()
    const result = highlightLog(manyLines)
    const elapsed = performance.now() - start
    expect(result).toBeDefined()
    expect(elapsed).toBeLessThan(2000)
  })
})

describe('Numbers Inside Words', () => {
  it('does NOT highlight numbers inside words like base64', () => {
    const result = highlightLog('base64encoded')
    expect(containsStyle(result, CYAN)).toBe(false)
  })

  it('does NOT highlight numbers inside words like md5hash', () => {
    const result = highlightLog('md5hash')
    expect(containsStyle(result, CYAN)).toBe(false)
  })

  it('does NOT highlight numbers in words like file123', () => {
    const result = highlightLog('file123')
    expect(containsStyle(result, CYAN)).toBe(false)
  })

  it('highlights standalone numbers correctly', () => {
    const result = highlightLog('timeout after 30 seconds')
    expect(containsStyle(result, CYAN)).toBe(true)
  })
})

describe('HIGHLIGHT_GROUPS', () => {
  it('exports HIGHLIGHT_GROUPS constant', () => {
    expect(HIGHLIGHT_GROUPS).toBeDefined()
    expect(Array.isArray(HIGHLIGHT_GROUPS)).toBe(true)
    expect(HIGHLIGHT_GROUPS.length).toBeGreaterThan(0)
  })

  it('each group has name, enabled, and description', () => {
    HIGHLIGHT_GROUPS.forEach((group: { name: string; enabled: boolean; description: string }) => {
      expect(group.name).toBeDefined()
      expect(typeof group.enabled).toBe('boolean')
      expect(group.description).toBeDefined()
    })
  })
})

describe('highlightLogWithStats', () => {
  it('returns html and stats object', () => {
    const result = highlightLogWithStats('test line')
    expect(result.html).toBeDefined()
    expect(result.stats).toBeDefined()
    expect(result.stats.linesProcessed).toBe(1)
  })

  it('reports processing time', () => {
    const result = highlightLogWithStats('2024-01-15 10:23:45 INFO test')
    expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns 0 lines for empty input', () => {
    const result = highlightLogWithStats('')
    expect(result.stats.linesProcessed).toBe(0)
  })
})
