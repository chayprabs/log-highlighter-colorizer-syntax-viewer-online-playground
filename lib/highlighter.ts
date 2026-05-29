/**
 * Glow — regex log highlighter (client-side only).
 * All user text is HTML-escaped before any <span> is injected.
 */

import type { TokenId } from '@/lib/urlState'
import { KNOWN_TOKEN_IDS } from '@/lib/urlState'
import { tokenIdToGlowClass } from '@/lib/glow-token-classes'

export const SYNC_LINE_THRESHOLD = 5_000
export const CHUNK_LINE_SIZE = 1_000
/** Max CPU wall time per line before falling back to escaped plain text (PRD §11.1 / §12). */
export const PER_LINE_TIMEOUT_MS = 100
export const QUOTED_STRING_MAX_INNER = 500
export const KEY_MAX_LEN = 64

const ANSI_PATTERN = /\x1b(?:\[[0-9;?]*[ -/]*[@-~]|[@-_])/g
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

export interface Span {
  start: number
  end: number
  token: TokenId
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '')
}

function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS_PATTERN, '')
}

export function sanitizeInput(rawInput: string): string {
  return stripControlChars(stripAnsi(normalizeLineEndings(rawInput)))
}

function cloneRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags)
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}

function isOverlappingClaimed(claimed: Span[], start: number, end: number): boolean {
  return claimed.some(s => rangesOverlap(s.start, s.end, start, end))
}

function addSpan(claimed: Span[], start: number, end: number, token: TokenId): void {
  if (start >= end || isOverlappingClaimed(claimed, start, end)) {
    return
  }
  claimed.push({ start, end, token })
}

function findUrlSpans(line: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = []
  const re = /\b(?:https?|ftp):\/\/[^\s<>"]+/gi
  for (const match of Array.from(line.matchAll(re))) {
    if (match.index === undefined) {
      continue
    }
    let raw = match[0]
    while (/[),.;]$/.test(raw)) {
      raw = raw.slice(0, -1)
    }
    spans.push({ start: match.index, end: match.index + raw.length })
  }
  return spans
}

function insideAnyRange(index: number, end: number, ranges: Array<{ start: number; end: number }>): boolean {
  return ranges.some(r => rangesOverlap(index, end, r.start, r.end))
}

const ISO_DATETIME_RE =
  /\b(19\d{2}|20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:[T\s])([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.,](\d{1,9}))?(Z|[+-]\d{2}:?\d{2})?\b/g

const ISO_DATE_ONLY_RE = /\b(19\d{2}|20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g

const NGINX_DATETIME_RE =
  /(?:\[)?(\d{2})\/([A-Za-z]{3})\/(\d{4}):([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\s([+-]\d{4}))?(?:\])?/g

const SYSLOG_DATETIME_RE =
  /\b([A-Za-z]{3})\s+(\d{1,2})\s+([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\b/g

const TIME_ONLY_RE =
  /\b([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:[.,](\d{1,9}))?(Z|[+-]\d{2}:?\d{2})?\b/g

const EPOCH_RE = /\b(?:1\d{9}|[2-9]\d{9})(?:\.(\d{1,3}))?\b/g

const LEVEL_ERROR_RE = /\b(?:ERROR|FATAL|CRITICAL)\b/gi
const LEVEL_WARN_RE = /\bWARN(?:ING)?\b/gi
const LEVEL_INFO_RE = /\bINFO\b/gi
const LEVEL_DEBUG_RE = /\b(?:DEBUG|TRACE)\b/gi

const STATUS_RE = /(?<=[\s\[\(,:]|^)\b([2345]\d{2})\b(?=[\s\]\),:]|$)/g

const HTTP_METHOD_RE =
  /(?:^|[\s"'])(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\b(?=\s|\/)/g

const URL_RE = /\b(?:https?|ftp):\/\/[^\s<>"]+/gi

const IPV4_RE =
  /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

const PATH_RE = /(?<!\w)(\/(?:[a-zA-Z0-9_\-.]+\/)*[a-zA-Z0-9_\-.]+)/g

const KEY_VALUE_RE = new RegExp(
  `(^|[\\s\\[{(,])(\\w{1,${KEY_MAX_LEN}})([=:])(?!//)\\s*(?:"(?:[^"\\\\]|\\\\.){0,${QUOTED_STRING_MAX_INNER}}"|'(?:[^'\\\\]|\\\\.){0,${QUOTED_STRING_MAX_INNER}}'|\\S+)`,
  'g'
)

const JSON_KEY_RE = /"([^"\\]{1,200})"(?=\s*:)/g

const DOUBLE_QUOTE_RE = new RegExp(`"(?:[^"\\\\]|\\\\.){0,${QUOTED_STRING_MAX_INNER}}"`, 'g')
const SINGLE_QUOTE_RE = new RegExp(`'(?:[^'\\\\]|\\\\.){0,${QUOTED_STRING_MAX_INNER}}'`, 'g')

const NUMBER_RE = /(?<![A-Za-z0-9_.])(?:0|[1-9]\d*)(?:\.\d+)?(?![A-Za-z0-9_.])/g

const LITERAL_RE = /\b(?:true|false|null|undefined|nil)\b/gi

/**
 * Every regex used for sanitisation or token scanning (PRD §11.1 safe-regex audit).
 */
export const HIGHLIGHTER_AUDIT_REGEXES: readonly RegExp[] = [
  ANSI_PATTERN,
  CONTROL_CHARS_PATTERN,
  ISO_DATETIME_RE,
  ISO_DATE_ONLY_RE,
  NGINX_DATETIME_RE,
  SYSLOG_DATETIME_RE,
  TIME_ONLY_RE,
  EPOCH_RE,
  LEVEL_ERROR_RE,
  LEVEL_WARN_RE,
  LEVEL_INFO_RE,
  LEVEL_DEBUG_RE,
  STATUS_RE,
  HTTP_METHOD_RE,
  URL_RE,
  IPV4_RE,
  UUID_RE,
  PATH_RE,
  KEY_VALUE_RE,
  JSON_KEY_RE,
  DOUBLE_QUOTE_RE,
  SINGLE_QUOTE_RE,
  NUMBER_RE,
  LITERAL_RE,
]

function tokenEnabled(enabled: ReadonlySet<TokenId> | undefined, id: TokenId): boolean {
  return !enabled || enabled.has(id)
}

function highlightTimestamp(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'timestamp')) {
    return
  }

  for (const re of [
    ISO_DATETIME_RE,
    ISO_DATE_ONLY_RE,
    NGINX_DATETIME_RE,
    SYSLOG_DATETIME_RE,
    TIME_ONLY_RE,
    EPOCH_RE,
  ]) {
    for (const m of Array.from(line.matchAll(cloneRegex(re)))) {
      if (m.index === undefined) {
        continue
      }
      addSpan(claimed, m.index, m.index + m[0].length, 'timestamp')
    }
  }
}

function highlightLevelError(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'level-error')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(LEVEL_ERROR_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'level-error')
  }
}

function highlightLevelWarn(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'level-warn')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(LEVEL_WARN_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'level-warn')
  }
}

function highlightLevelInfo(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'level-info')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(LEVEL_INFO_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'level-info')
  }
}

function highlightLevelDebug(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'level-debug')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(LEVEL_DEBUG_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'level-debug')
  }
}

function statusToken(code: number): TokenId | null {
  if (code >= 500) {
    return 'status-5xx'
  }
  if (code >= 400) {
    return 'status-4xx'
  }
  if (code >= 300) {
    return 'status-3xx'
  }
  if (code >= 200) {
    return 'status-2xx'
  }
  return null
}

function highlightStatus(line: string, claimed: Span[], urlSpans: Array<{ start: number; end: number }>, enabled: ReadonlySet<TokenId> | undefined): void {
  for (const m of Array.from(line.matchAll(cloneRegex(STATUS_RE)))) {
    if (m.index === undefined) {
      continue
    }
    const start = m.index
    const end = start + m[0].length
    if (insideAnyRange(start, end, urlSpans)) {
      continue
    }
    const code = Number(m[1])
    const tok = statusToken(code)
    if (!tok || !tokenEnabled(enabled, tok)) {
      continue
    }
    addSpan(claimed, start, end, tok)
  }
}

function highlightHttpMethod(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'http-method')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(HTTP_METHOD_RE)))) {
    if (m.index === undefined || !m[1]) {
      continue
    }
    const method = m[1]
    const full = m[0]
    const methodStart = m.index + full.length - method.length
    addSpan(claimed, methodStart, methodStart + method.length, 'http-method')
  }
}

function highlightUrl(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'url')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(URL_RE)))) {
    if (m.index === undefined) {
      continue
    }
    let raw = m[0]
    while (/[),.;]$/.test(raw)) {
      raw = raw.slice(0, -1)
    }
    addSpan(claimed, m.index, m.index + raw.length, 'url')
  }
}

function highlightIp(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'ip')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(IPV4_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'ip')
  }
}

function highlightUuid(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'uuid')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(UUID_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'uuid')
  }
}

function highlightPath(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'path')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(PATH_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'path')
  }
}

function highlightKeyValue(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  const keyOn = tokenEnabled(enabled, 'key')
  const valueOn = tokenEnabled(enabled, 'value')
  if (!keyOn && !valueOn) {
    return
  }

  for (const m of Array.from(line.matchAll(cloneRegex(KEY_VALUE_RE)))) {
    if (m.index === undefined) {
      continue
    }
    const boundary = m[1] ?? ''
    const key = m[2] ?? ''
    const sep = m[3] ?? ''
    const fullMatch = m[0]
    const keyStart = m.index + boundary.length
    const afterSep = keyStart + key.length + sep.length
    const valueEnd = m.index + fullMatch.length
    let valueStart = afterSep
    while (valueStart < valueEnd && /\s/.test(line[valueStart] ?? '')) {
      valueStart += 1
    }

    if (key && keyOn) {
      addSpan(claimed, keyStart, keyStart + key.length, 'key')
    }
    if (valueOn && valueStart < valueEnd) {
      addSpan(claimed, valueStart, valueEnd, 'value')
    }
  }
}

function highlightJsonKey(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'json-key')) {
    return
  }
  const trimmed = line.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return
  }
  try {
    JSON.parse(trimmed)
  } catch {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(JSON_KEY_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'json-key')
  }
}

function highlightQuoted(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'string')) {
    return
  }
  for (const re of [DOUBLE_QUOTE_RE, SINGLE_QUOTE_RE]) {
    for (const m of Array.from(line.matchAll(cloneRegex(re)))) {
      if (m.index === undefined) {
        continue
      }
      addSpan(claimed, m.index, m.index + m[0].length, 'string')
    }
  }
}

function highlightNumbers(line: string, claimed: Span[], urlSpans: Array<{ start: number; end: number }>, enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'number')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(NUMBER_RE)))) {
    if (m.index === undefined) {
      continue
    }
    const start = m.index
    const end = start + m[0].length
    if (insideAnyRange(start, end, urlSpans)) {
      continue
    }
    const n = Number(m[0])
    if (m[0].length === 3 && n >= 200 && n <= 599) {
      continue
    }
    addSpan(claimed, start, end, 'number')
  }
}

function highlightLiteral(line: string, claimed: Span[], enabled: ReadonlySet<TokenId> | undefined): void {
  if (!tokenEnabled(enabled, 'literal')) {
    return
  }
  for (const m of Array.from(line.matchAll(cloneRegex(LITERAL_RE)))) {
    if (m.index === undefined) {
      continue
    }
    addSpan(claimed, m.index, m.index + m[0].length, 'literal')
  }
}

function applySpans(line: string, spans: Span[]): string {
  if (spans.length === 0) {
    return escapeHtml(line)
  }

  const ordered = [...spans].sort((a, b) => a.start - b.start || b.end - a.end)
  const parts: string[] = []
  let cursor = 0

  for (const span of ordered) {
    if (span.start > cursor) {
      parts.push(escapeHtml(line.slice(cursor, span.start)))
    }
    if (span.start >= cursor) {
      const slice = line.slice(span.start, span.end)
      parts.push(`<span class="${tokenIdToGlowClass(span.token)}">${escapeHtml(slice)}</span>`)
      cursor = Math.max(cursor, span.end)
    }
  }

  if (cursor < line.length) {
    parts.push(escapeHtml(line.slice(cursor)))
  }

  return parts.join('')
}

function elapsed(start: number): number {
  return performance.now() - start
}

export function highlightLine(line: string, enabledTokens?: ReadonlySet<TokenId>): string {
  const t0 = performance.now()
  if (line.length === 0) {
    return ''
  }

  const urlSpans = findUrlSpans(line)
  const claimed: Span[] = []

  const steps: Array<() => void> = [
    () => highlightTimestamp(line, claimed, enabledTokens),
    () => highlightLevelError(line, claimed, enabledTokens),
    () => highlightLevelWarn(line, claimed, enabledTokens),
    () => highlightLevelInfo(line, claimed, enabledTokens),
    () => highlightLevelDebug(line, claimed, enabledTokens),
    () => highlightStatus(line, claimed, urlSpans, enabledTokens),
    () => highlightHttpMethod(line, claimed, enabledTokens),
    () => highlightUrl(line, claimed, enabledTokens),
    () => highlightIp(line, claimed, enabledTokens),
    () => highlightUuid(line, claimed, enabledTokens),
    () => highlightPath(line, claimed, enabledTokens),
    () => highlightKeyValue(line, claimed, enabledTokens),
    () => highlightJsonKey(line, claimed, enabledTokens),
    () => highlightQuoted(line, claimed, enabledTokens),
    () => highlightNumbers(line, claimed, urlSpans, enabledTokens),
    () => highlightLiteral(line, claimed, enabledTokens),
  ]

  for (const step of steps) {
    step()
    if (elapsed(t0) > PER_LINE_TIMEOUT_MS) {
      return escapeHtml(line)
    }
  }

  return applySpans(line, claimed)
}

export function lineToHtmlDiv(line: string, enabledTokens?: ReadonlySet<TokenId>): string {
  const inner = line.length === 0 ? '&nbsp;' : highlightLine(line, enabledTokens)
  return `<div class="log-line">${inner}</div>`
}

export function highlightLogSync(input: string, enabledTokens?: ReadonlySet<TokenId>): string {
  if (!input) {
    return ''
  }
  const sanitized = sanitizeInput(input)
  const lines = sanitized.split('\n')
  return lines.map(l => lineToHtmlDiv(l, enabledTokens)).join('')
}


/** Per-line safe HTML (inner content only) for React rendering. */
export function highlightLinesSync(input: string, enabledTokens?: ReadonlySet<TokenId>): string[] {
  if (!input) {
    return []
  }
  const sanitized = sanitizeInput(input)
  return sanitized.split('\n').map(line => (line.length === 0 ? '' : highlightLine(line, enabledTokens)))
}

export interface HighlightLinesAsyncOptions {
  enabledTokens?: ReadonlySet<TokenId>
  onProgress?: (processedLines: number, totalLines: number, partial: string[]) => void
  signal?: AbortSignal
}

export async function highlightLinesAsync(
  input: string,
  options?: HighlightLinesAsyncOptions
): Promise<string[]> {
  if (!input) {
    return []
  }

  const sanitized = sanitizeInput(input)
  const lines = sanitized.split('\n')
  const enabled = options?.enabledTokens
  const result: string[] = []

  if (lines.length <= SYNC_LINE_THRESHOLD) {
    for (const line of lines) {
      result.push(line.length === 0 ? '' : highlightLine(line, enabled))
    }
    options?.onProgress?.(lines.length, lines.length, result)
    return result
  }

  for (let i = 0; i < lines.length; i += CHUNK_LINE_SIZE) {
    if (options?.signal?.aborted) {
      break
    }

    const batch = lines.slice(i, i + CHUNK_LINE_SIZE)
    for (const line of batch) {
      result.push(line.length === 0 ? '' : highlightLine(line, enabled))
    }
    options?.onProgress?.(result.length, lines.length, [...result])

    if (i + CHUNK_LINE_SIZE < lines.length) {
      await yieldBetweenChunks()
    }
  }

  return result
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/** Yield between chunks — PRD §6.4 prefers idle callbacks when available. */
function yieldBetweenChunks(): Promise<void> {
  if (typeof requestIdleCallback !== 'undefined') {
    return new Promise(resolve => {
      requestIdleCallback(() => resolve(), { timeout: 50 })
    })
  }
  return delay(0)
}

export interface HighlightAsyncOptions {
  enabledTokens?: ReadonlySet<TokenId>
  onProgress?: (processedLines: number, totalLines: number) => void
  signal?: AbortSignal
}

export async function highlightLogAsync(input: string, options?: HighlightAsyncOptions): Promise<string> {
  if (!input) {
    return ''
  }

  const sanitized = sanitizeInput(input)
  const lines = sanitized.split('\n')
  const enabled = options?.enabledTokens

  if (lines.length <= SYNC_LINE_THRESHOLD) {
    return lines.map(l => lineToHtmlDiv(l, enabled)).join('')
  }

  const chunks: string[] = []
  let processed = 0

  for (let i = 0; i < lines.length; i += CHUNK_LINE_SIZE) {
    if (options?.signal?.aborted) {
      break
    }

    const batch = lines.slice(i, i + CHUNK_LINE_SIZE)
    const html = batch.map(l => lineToHtmlDiv(l, enabled)).join('')
    chunks.push(html)
    processed += batch.length
    options?.onProgress?.(processed, lines.length)

    if (i + CHUNK_LINE_SIZE < lines.length) {
      await yieldBetweenChunks()
    }
  }

  return chunks.join('')
}

export function defaultEnabledTokenSet(): Set<TokenId> {
  return new Set(KNOWN_TOKEN_IDS)
}

/** @deprecated Use highlightLogSync — kept for transitional imports */
export function highlightLog(input: string, enabledTokens?: ReadonlySet<TokenId>): string {
  return highlightLogSync(input, enabledTokens)
}
