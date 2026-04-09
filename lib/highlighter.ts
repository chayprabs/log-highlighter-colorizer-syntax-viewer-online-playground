/**
 * Log Highlighter - Core highlighting engine
 *
 * The pipeline is intentionally conservative:
 *   1. Sanitize raw input
 *   2. Process each line with a strict highlight priority
 *   3. Escape raw text before any span injection
 *   4. Prevent overlapping spans so later groups never rewrite earlier ones
 */

export interface Span {
  start: number
  end: number
  style: string
}

export interface HighlightGroupConfig {
  name: string
  enabled: boolean
  description: string
}

export interface HighlightStats {
  linesProcessed: number
  processingTimeMs: number
}

export const HIGHLIGHT_GROUPS: HighlightGroupConfig[] = [
  { name: 'dates', enabled: true, description: 'Dates, timestamps, syslog, and nginx-style time strings' },
  { name: 'keywords', enabled: true, description: 'Booleans, null-like values, log levels, and HTTP methods' },
  { name: 'urls', enabled: true, description: 'HTTP and HTTPS URLs with query parameters' },
  { name: 'numbers', enabled: true, description: 'Standalone integers and decimals' },
  { name: 'ipv4', enabled: true, description: 'IPv4 addresses with strict octet validation' },
  { name: 'quotes', enabled: true, description: 'Double-quoted strings' },
  { name: 'paths', enabled: true, description: 'Unix-like absolute and relative paths' },
  { name: 'uuids', enabled: true, description: 'UUID values' },
  { name: 'keyValue', enabled: true, description: 'key=value and key: value pairs' },
  { name: 'statusCodes', enabled: true, description: 'HTTP status codes' },
  { name: 'json', enabled: true, description: 'JSON object keys on valid JSON lines' },
]

const COLORS = {
  red: 'color: #dc4b4b',
  green: 'color: #6eb56c',
  yellow: 'color: #f0d42a',
  blue: 'color: #2aa1d3',
  magenta: 'color: #c51e8a',
  cyan: 'color: #36c4c4',
  white: 'color: #f8f8f2',
  black: 'color: #000000',
  faint: 'opacity: 0.6',
}

const DATE_STYLE = COLORS.magenta
const DATE_SEPARATOR_STYLE = combineStyles(COLORS.magenta, COLORS.faint)
const TIME_STYLE = COLORS.blue
const TIME_SEPARATOR_STYLE = combineStyles(COLORS.blue, COLORS.faint)
const TIMEZONE_STYLE = COLORS.red
const NUMBER_STYLE = COLORS.cyan
const IPV4_STYLE = combineStyles(COLORS.blue, 'font-style: italic')
const PATH_STYLE = combineStyles(COLORS.green, 'font-style: italic')
const UUID_PRIMARY_STYLE = combineStyles(COLORS.blue, 'font-style: italic')
const UUID_SECONDARY_STYLE = combineStyles(COLORS.magenta, 'font-style: italic')
const KEY_STYLE = combineStyles(COLORS.white, COLORS.faint)
const METHOD_GET_STYLE = combineStyles(COLORS.black, 'background-color: #50fa7b', 'font-weight: bold')
const METHOD_POST_STYLE = combineStyles(COLORS.black, 'background-color: #f1fa8c', 'font-weight: bold')
const METHOD_WRITE_STYLE = combineStyles(COLORS.black, 'background-color: #ff79c6', 'font-weight: bold')
const METHOD_DELETE_STYLE = combineStyles(COLORS.black, 'background-color: #ff5555', 'font-weight: bold')
const METHOD_MISC_STYLE = combineStyles(COLORS.black, 'background-color: #8be9fd', 'font-weight: bold')

const ANSI_PATTERN = /\x1b(?:\[[0-9;?]*[ -/]*[@-~]|[@-_])/g
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
const REPEATED_QUOTE_PATTERN = /"(?:\\.|[^"\\])*"/g
const ISO_DATETIME_PATTERN =
  /\b(19\d{2}|20\d{2})(-)(0[1-9]|1[0-2])(-)(0[1-9]|[12]\d|3[01])([T\s])([01]\d|2[0-3])(:)([0-5]\d)(:)([0-5]\d)(?:([.,])(\d+))?(Z|[+-]\d{2}:?\d{2})?\b/g
const ISO_DATE_PATTERN = /\b(19\d{2}|20\d{2})(-)(0[1-9]|1[0-2])(-)(0[1-9]|[12]\d|3[01])\b/g
const NGINX_DATETIME_PATTERN =
  /(?:\[)?(\d{2})(\/)([A-Za-z]{3})(\/)(\d{4})(:)(\d{2})(:)(\d{2})(:)(\d{2})(?:\s([+-]\d{4}))?(?:\])?/g
const SYSLOG_DATETIME_PATTERN =
  /\b([A-Za-z]{3})(\s+)(\d{1,2})(\s+)([01]\d|2[0-3])(:)([0-5]\d)(:)([0-5]\d)\b/g
const TIME_ONLY_PATTERN =
  /\b([01]\d|2[0-3])(:)([0-5]\d)(:)([0-5]\d)(?:([.,])(\d+))?(Z|[+-]\d{2}:?\d{2})?\b/g
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/g
const NUMBER_PATTERN = /(?<![A-Za-z0-9_.-])(?:0|[1-9]\d*)(?:\.\d+)?(?![A-Za-z0-9_.-])/g
const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
const IPV4_CIDR = '(?:3[0-2]|[12]?\\d)'
const IPV4_PATTERN = new RegExp(
  `(?<![\\d.])(${IPV4_OCTET})(\\. )`.replace(' ', '')
    + `(${IPV4_OCTET})(\\. )`.replace(' ', '')
    + `(${IPV4_OCTET})(\\. )`.replace(' ', '')
    + `(${IPV4_OCTET})(?:\\/(${IPV4_CIDR}))?(?![\\d.])`,
  'g'
)
const PATH_PATTERN = /(^|[\s(\[{,;])((?:~\/|\.{1,2}\/|\/)(?:[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)?)/g
const UUID_PATTERN = /\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b/g
const KEY_VALUE_PATTERN = /(^|[\s\[{(,])([A-Za-z_][A-Za-z0-9_.-]{0,63})([=:])(?!\/\/)\s*([^\s,;]+)?/g
const STATUS_CODE_PATTERN = /(?<![./:-])\b([1-5][0-9]{2})\b(?![./:-])/g
const JSON_KEY_PATTERN = /"([^"\\]+)"(?=\s*:)/g

const BOOLEAN_PATTERNS: Array<[RegExp, string]> = [
  [/\bnull\b/gi, COLORS.red],
  [/\bnil\b/gi, COLORS.red],
  [/\bNaN\b/g, COLORS.red],
  [/\bundefined\b/gi, COLORS.red],
  [/\bfalse\b/gi, combineStyles(COLORS.red, 'font-style: italic')],
  [/\btrue\b/gi, combineStyles(COLORS.green, 'font-style: italic')],
]

const METHOD_PATTERNS: Array<[RegExp, string]> = [
  [/\bGET\b/g, METHOD_GET_STYLE],
  [/\bPOST\b/g, METHOD_POST_STYLE],
  [/\bPUT\b/g, METHOD_WRITE_STYLE],
  [/\bPATCH\b/g, METHOD_WRITE_STYLE],
  [/\bDELETE\b/g, METHOD_DELETE_STYLE],
  [/\bHEAD\b/g, METHOD_MISC_STYLE],
  [/\bOPTIONS\b/g, METHOD_MISC_STYLE],
  [/\bCONNECT\b/g, METHOD_MISC_STYLE],
]

const SEVERITY_PATTERNS: Array<[RegExp, string]> = [
  [/\bERROR\b/g, COLORS.red],
  [/\bWARN(?:ING)?\b/g, COLORS.yellow],
  [/\bINFO\b/g, COLORS.white],
  [/\bDEBUG\b/g, COLORS.green],
  [/\bSUCCESS\b/g, COLORS.green],
  [/\bTRACE\b/g, combineStyles(COLORS.white, COLORS.faint)],
]

function combineStyles(...styles: string[]): string {
  return styles.join('; ')
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
}

function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '')
}

function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS_PATTERN, '')
}

function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function sanitizeInput(rawInput: string): string {
  return stripControlChars(stripAnsi(normalizeLineEndings(rawInput)))
}

function cloneRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags)
}

function isOverlapping(spans: Span[], start: number, end: number): boolean {
  return spans.some(span => start < span.end && end > span.start)
}

function addSpan(spans: Span[], start: number, end: number, style: string): void {
  if (start >= end || isOverlapping(spans, start, end)) {
    return
  }
  spans.push({ start, end, style })
}

function addStyledToken(
  spans: Span[],
  matchStart: number,
  tokens: Array<{ text: string; style: string }>
): void {
  let cursor = matchStart
  for (const token of tokens) {
    addSpan(spans, cursor, cursor + token.text.length, token.style)
    cursor += token.text.length
  }
}

function applySpans(text: string, spans: Span[]): string {
  if (spans.length === 0) {
    return escapeHtml(text)
  }

  const orderedSpans = [...spans].sort((left, right) => left.start - right.start)
  const result: string[] = []
  let cursor = 0

  for (const span of orderedSpans) {
    if (span.start > cursor) {
      result.push(escapeHtml(text.slice(cursor, span.start)))
    }

    if (span.start >= cursor) {
      result.push(
        `<span style="${span.style}">${escapeHtml(text.slice(span.start, span.end))}</span>`
      )
      cursor = span.end
    }
  }

  if (cursor < text.length) {
    result.push(escapeHtml(text.slice(cursor)))
  }

  return result.join('')
}

function isStatusCodeContext(line: string, start: number, end: number, code: number): boolean {
  if (code < 100 || code > 599) {
    return false
  }

  const before = line.slice(Math.max(0, start - 16), start)
  const after = line.slice(end)
  const nextToken = after.match(/^\s+([A-Z][A-Za-z-]*)/)

  return (
    nextToken !== null
    || /^\s*$/.test(after)
    || /HTTP\/\d(?:\.\d)?\s*$/.test(before)
    || /\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+$/.test(before)
  )
}

function highlightDates(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(ISO_DATETIME_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, year, dash1, month, dash2, day, separator, hour, colon1, minute, colon2, second, fractionSeparator, fraction, timezone] = match
    if (isOverlapping(spans, match.index, match.index + full.length)) {
      continue
    }

    const tokens = [
      { text: year, style: DATE_STYLE },
      { text: dash1, style: DATE_SEPARATOR_STYLE },
      { text: month, style: DATE_STYLE },
      { text: dash2, style: DATE_SEPARATOR_STYLE },
      { text: day, style: DATE_STYLE },
      { text: separator, style: DATE_SEPARATOR_STYLE },
      { text: hour, style: TIME_STYLE },
      { text: colon1, style: TIME_SEPARATOR_STYLE },
      { text: minute, style: TIME_STYLE },
      { text: colon2, style: TIME_SEPARATOR_STYLE },
      { text: second, style: TIME_STYLE },
    ]

    if (fractionSeparator && fraction) {
      tokens.push({ text: fractionSeparator, style: TIME_SEPARATOR_STYLE })
      tokens.push({ text: fraction, style: TIME_STYLE })
    }

    if (timezone) {
      tokens.push({ text: timezone, style: TIMEZONE_STYLE })
    }

    addStyledToken(spans, match.index, tokens)
  }

  for (const match of Array.from(line.matchAll(cloneRegex(NGINX_DATETIME_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, day, slash1, month, slash2, year, colon0, hour, colon1, minute, colon2, second, timezone] = match
    const startOffset = full.startsWith('[') ? 1 : 0
    const coreLength = full.length - startOffset - (full.endsWith(']') ? 1 : 0)
    const coreStart = match.index + startOffset

    if (isOverlapping(spans, coreStart, coreStart + coreLength)) {
      continue
    }

    const tokens = [
      { text: day, style: DATE_STYLE },
      { text: slash1, style: DATE_SEPARATOR_STYLE },
      { text: month, style: DATE_STYLE },
      { text: slash2, style: DATE_SEPARATOR_STYLE },
      { text: year, style: DATE_STYLE },
      { text: colon0, style: DATE_SEPARATOR_STYLE },
      { text: hour, style: TIME_STYLE },
      { text: colon1, style: TIME_SEPARATOR_STYLE },
      { text: minute, style: TIME_STYLE },
      { text: colon2, style: TIME_SEPARATOR_STYLE },
      { text: second, style: TIME_STYLE },
    ]

    if (timezone) {
      tokens.push({ text: ' ', style: DATE_SEPARATOR_STYLE })
      tokens.push({ text: timezone, style: TIMEZONE_STYLE })
    }

    addStyledToken(spans, coreStart, tokens)
  }

  for (const match of Array.from(line.matchAll(cloneRegex(SYSLOG_DATETIME_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, month, space1, day, space2, hour, colon1, minute, colon2, second] = match
    if (isOverlapping(spans, match.index, match.index + full.length)) {
      continue
    }

    addStyledToken(spans, match.index, [
      { text: month, style: DATE_STYLE },
      { text: space1, style: DATE_SEPARATOR_STYLE },
      { text: day, style: DATE_STYLE },
      { text: space2, style: DATE_SEPARATOR_STYLE },
      { text: hour, style: TIME_STYLE },
      { text: colon1, style: TIME_SEPARATOR_STYLE },
      { text: minute, style: TIME_STYLE },
      { text: colon2, style: TIME_SEPARATOR_STYLE },
      { text: second, style: TIME_STYLE },
    ])
  }

  for (const match of Array.from(line.matchAll(cloneRegex(ISO_DATE_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, year, dash1, month, dash2, day] = match
    if (isOverlapping(spans, match.index, match.index + full.length)) {
      continue
    }

    addStyledToken(spans, match.index, [
      { text: year, style: DATE_STYLE },
      { text: dash1, style: DATE_SEPARATOR_STYLE },
      { text: month, style: DATE_STYLE },
      { text: dash2, style: DATE_SEPARATOR_STYLE },
      { text: day, style: DATE_STYLE },
    ])
  }

  for (const match of Array.from(line.matchAll(cloneRegex(TIME_ONLY_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, hour, colon1, minute, colon2, second, fractionSeparator, fraction, timezone] = match
    if (isOverlapping(spans, match.index, match.index + full.length)) {
      continue
    }

    const tokens = [
      { text: hour, style: TIME_STYLE },
      { text: colon1, style: TIME_SEPARATOR_STYLE },
      { text: minute, style: TIME_STYLE },
      { text: colon2, style: TIME_SEPARATOR_STYLE },
      { text: second, style: TIME_STYLE },
    ]

    if (fractionSeparator && fraction) {
      tokens.push({ text: fractionSeparator, style: TIME_SEPARATOR_STYLE })
      tokens.push({ text: fraction, style: TIME_STYLE })
    }

    if (timezone) {
      tokens.push({ text: timezone, style: TIMEZONE_STYLE })
    }

    addStyledToken(spans, match.index, tokens)
  }

  return spans
}

function highlightKeywords(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const [pattern, style] of [...BOOLEAN_PATTERNS, ...METHOD_PATTERNS, ...SEVERITY_PATTERNS]) {
    for (const match of Array.from(line.matchAll(cloneRegex(pattern)))) {
      if (match.index === undefined) {
        continue
      }
      addSpan(spans, match.index, match.index + match[0].length, style)
    }
  }

  return spans
}

function highlightUrls(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(URL_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    let rawUrl = match[0]
    while (/[),.;]$/.test(rawUrl)) {
      rawUrl = rawUrl.slice(0, -1)
    }

    const start = match.index
    const end = start + rawUrl.length

    if (isOverlapping(spans, start, end)) {
      continue
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(rawUrl)
    } catch {
      continue
    }

    const protocolText = `${parsedUrl.protocol.slice(0, -1)}`
    const hostText = parsedUrl.hostname
    const portText = parsedUrl.port
    const pathText = `${parsedUrl.pathname}${parsedUrl.hash}`
    const searchText = parsedUrl.search

    const protocolStyle =
      parsedUrl.protocol === 'https:' ? combineStyles(COLORS.green, COLORS.faint) : combineStyles(COLORS.red, COLORS.faint)

    let cursor = start
    addSpan(spans, cursor, cursor + protocolText.length, protocolStyle)
    cursor += protocolText.length

    addSpan(spans, cursor, cursor + 3, combineStyles(COLORS.red, COLORS.faint))
    cursor += 3

    addSpan(spans, cursor, cursor + hostText.length, combineStyles(COLORS.blue, COLORS.faint))
    cursor += hostText.length

    if (portText) {
      addSpan(spans, cursor, cursor + 1, combineStyles(COLORS.red, COLORS.faint))
      cursor += 1
      addSpan(spans, cursor, cursor + portText.length, combineStyles(COLORS.blue, COLORS.faint))
      cursor += portText.length
    }

    if (pathText) {
      const pathOnly = parsedUrl.pathname || ''
      if (pathOnly) {
        addSpan(spans, cursor, cursor + pathOnly.length, COLORS.blue)
        cursor += pathOnly.length
      }
      if (parsedUrl.hash) {
        addSpan(spans, cursor, cursor + parsedUrl.hash.length, combineStyles(COLORS.blue, COLORS.faint))
        cursor += parsedUrl.hash.length
      }
    }

    if (searchText) {
      addSpan(spans, cursor, cursor + 1, combineStyles(COLORS.red, COLORS.faint))
      cursor += 1

      const queryBody = searchText.slice(1)
      const params = queryBody.split('&')
      params.forEach((param, index) => {
        const [key, value = ''] = param.split('=')
        if (key) {
          addSpan(spans, cursor, cursor + key.length, COLORS.magenta)
          cursor += key.length
        }

        if (param.includes('=')) {
          addSpan(spans, cursor, cursor + 1, combineStyles(COLORS.red, COLORS.faint))
          cursor += 1
          if (value) {
            addSpan(spans, cursor, cursor + value.length, COLORS.cyan)
            cursor += value.length
          }
        }

        if (index < params.length - 1) {
          addSpan(spans, cursor, cursor + 1, combineStyles(COLORS.red, COLORS.faint))
          cursor += 1
        }
      })
    }
  }

  return spans
}

function highlightNumbers(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(NUMBER_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const code = Number(match[0])
    if (match[0].length === 3 && isStatusCodeContext(line, match.index, match.index + match[0].length, code)) {
      continue
    }

    addSpan(spans, match.index, match.index + match[0].length, NUMBER_STYLE)
  }

  return spans
}

function highlightIPv4(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(IPV4_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const [full, first, dot1, second, dot2, third, dot3, fourth, cidr] = match
    if (isOverlapping(spans, match.index, match.index + full.length)) {
      continue
    }

    let cursor = match.index
    addSpan(spans, cursor, cursor + first.length, IPV4_STYLE)
    cursor += first.length
    addSpan(spans, cursor, cursor + dot1.length, COLORS.red)
    cursor += dot1.length
    addSpan(spans, cursor, cursor + second.length, IPV4_STYLE)
    cursor += second.length
    addSpan(spans, cursor, cursor + dot2.length, COLORS.red)
    cursor += dot2.length
    addSpan(spans, cursor, cursor + third.length, IPV4_STYLE)
    cursor += third.length
    addSpan(spans, cursor, cursor + dot3.length, COLORS.red)
    cursor += dot3.length
    addSpan(spans, cursor, cursor + fourth.length, IPV4_STYLE)
    cursor += fourth.length

    if (cidr) {
      addSpan(spans, cursor, cursor + 1, COLORS.red)
      cursor += 1
      addSpan(spans, cursor, cursor + cidr.length, IPV4_STYLE)
    }
  }

  return spans
}

function highlightQuotes(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(REPEATED_QUOTE_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }
    addSpan(spans, match.index, match.index + match[0].length, COLORS.yellow)
  }

  return spans
}

function highlightPaths(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(PATH_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const boundary = match[1] ?? ''
    const pathText = match[2] ?? ''
    const pathStart = match.index + boundary.length
    const pathEnd = pathStart + pathText.length

    if (!pathText || isOverlapping(spans, pathStart, pathEnd)) {
      continue
    }

    let cursor = pathStart
    const prefixMatch = pathText.match(/^(~\/|\.{1,2}\/|\/)/)
    const prefix = prefixMatch?.[0] ?? ''

    if (prefix) {
      if (prefix.startsWith('.')) {
        addSpan(spans, cursor, cursor + prefix.length - 1, PATH_STYLE)
        addSpan(spans, cursor + prefix.length - 1, cursor + prefix.length, COLORS.yellow)
      } else if (prefix.startsWith('~/')) {
        addSpan(spans, cursor, cursor + 1, PATH_STYLE)
        addSpan(spans, cursor + 1, cursor + 2, COLORS.yellow)
      } else {
        addSpan(spans, cursor, cursor + prefix.length, COLORS.yellow)
      }
      cursor += prefix.length
    }

    const remainder = pathText.slice(prefix.length)
    const segments = remainder.split('/')
    segments.forEach((segment: string, index: number) => {
      if (segment) {
        addSpan(spans, cursor, cursor + segment.length, PATH_STYLE)
        cursor += segment.length
      }

      if (index < segments.length - 1) {
        addSpan(spans, cursor, cursor + 1, COLORS.yellow)
        cursor += 1
      }
    })
  }

  return spans
}

function highlightUUIDs(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(UUID_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    if (isOverlapping(spans, match.index, match.index + match[0].length)) {
      continue
    }

    const segments = match[0].split('-')
    let cursor = match.index

    segments.forEach((segment: string, index: number) => {
      const style = index === 1 || index === 2 || index === 3 ? UUID_SECONDARY_STYLE : UUID_PRIMARY_STYLE
      addSpan(spans, cursor, cursor + segment.length, style)
      cursor += segment.length

      if (index < segments.length - 1) {
        addSpan(spans, cursor, cursor + 1, COLORS.red)
        cursor += 1
      }
    })
  }

  return spans
}

function highlightKeyValue(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(KEY_VALUE_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    const boundary = match[1] ?? ''
    const key = match[2] ?? ''
    const separator = match[3] ?? ''
    const start = match.index + boundary.length
    const end = start + key.length + separator.length

    if (!key || isOverlapping(spans, start, end)) {
      continue
    }

    addSpan(spans, start, start + key.length, KEY_STYLE)
    addSpan(spans, start + key.length, end, COLORS.white)
  }

  return spans
}

function highlightStatusCodes(line: string, existingSpans: Span[]): Span[] {
  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(STATUS_CODE_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }

    if (isOverlapping(spans, match.index, match.index + match[0].length)) {
      continue
    }

    const code = Number(match[1])
    if (!isStatusCodeContext(line, match.index, match.index + match[0].length, code)) {
      continue
    }

    let style = ''

    if (code >= 200 && code < 300) {
      style = COLORS.green
    } else if (code >= 300 && code < 400) {
      style = COLORS.yellow
    } else if (code >= 400 && code < 500) {
      style = COLORS.red
    } else if (code >= 500) {
      style = combineStyles(COLORS.red, 'font-weight: bold')
    }

    if (style) {
      addSpan(spans, match.index, match.index + match[0].length, style)
    }
  }

  return spans
}

function highlightJSON(line: string, existingSpans: Span[]): Span[] {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return existingSpans
  }

  try {
    JSON.parse(trimmed)
  } catch {
    return existingSpans
  }

  const spans = [...existingSpans]

  for (const match of Array.from(line.matchAll(cloneRegex(JSON_KEY_PATTERN)))) {
    if (match.index === undefined) {
      continue
    }
    addSpan(spans, match.index, match.index + match[0].length, COLORS.yellow)
  }

  return spans
}

function processLine(rawLine: string): string {
  const MAX_LINE_PROCESS_MS = 50
  const MAX_LINE_LENGTH = 5000

  if (rawLine.length > MAX_LINE_LENGTH) {
    return escapeHtml(rawLine)
  }

  const start = performance.now()

  try {
    let spans: Span[] = []
    const pipeline = [
      highlightDates,
      highlightKeywords,
      highlightUrls,
      highlightNumbers,
      highlightIPv4,
      highlightQuotes,
      highlightPaths,
      highlightUUIDs,
      highlightKeyValue,
      highlightStatusCodes,
      highlightJSON,
    ]

    for (const highlighter of pipeline) {
      spans = highlighter(rawLine, spans)
      if (performance.now() - start > MAX_LINE_PROCESS_MS) {
        return escapeHtml(rawLine)
      }
    }

    return applySpans(rawLine, spans)
  } catch {
    return escapeHtml(rawLine)
  }
}

export function highlightLog(input: string): string {
  if (!input) {
    return ''
  }

  const sanitized = sanitizeInput(input)
  return sanitized
    .split('\n')
    .map(line => processLine(line))
    .join('\n')
}

export function highlightLogWithStats(input: string): { html: string; stats: HighlightStats } {
  const start = performance.now()

  if (!input) {
    return {
      html: '',
      stats: {
        linesProcessed: 0,
        processingTimeMs: 0,
      },
    }
  }

  const sanitized = sanitizeInput(input)
  const lines = sanitized.split('\n')
  const html = lines.map(line => processLine(line)).join('\n')
  const processingTimeMs = Math.round((performance.now() - start) * 100) / 100

  return {
    html,
    stats: {
      linesProcessed: lines.length,
      processingTimeMs,
    },
  }
}
