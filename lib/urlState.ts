import LZString from 'lz-string'

export const URL_STATE_PARAM = 'state'
export const MAX_URL_STATE_CHARS = 8_000
export const MAX_TEXT_BYTES = 10 * 1024 * 1024

export const KNOWN_TOKEN_IDS = [
  'timestamp',
  'level-error',
  'level-warn',
  'level-info',
  'level-debug',
  'status-5xx',
  'status-4xx',
  'status-3xx',
  'status-2xx',
  'http-method',
  'url',
  'ip',
  'uuid',
  'path',
  'key',
  'value',
  'json-key',
  'string',
  'number',
  'literal',
] as const

export type TokenId = (typeof KNOWN_TOKEN_IDS)[number]

export type ThemeId = 'dark' | 'light'
export type FontSizeId = 'small' | 'medium' | 'large'

export interface GlowUrlState {
  text: string
  theme: ThemeId
  lineNumbers: boolean
  wordWrap: boolean
  fontSize: FontSizeId
  enabledTokens: TokenId[]
  legendOpen: boolean
}

export const DEFAULT_GLOW_STATE: GlowUrlState = {
  text: '',
  theme: 'dark',
  lineNumbers: true,
  wordWrap: false,
  fontSize: 'medium',
  enabledTokens: [...KNOWN_TOKEN_IDS],
  legendOpen: true,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isThemeId(value: unknown): value is ThemeId {
  return value === 'dark' || value === 'light'
}

function isFontSizeId(value: unknown): value is FontSizeId {
  return value === 'small' || value === 'medium' || value === 'large'
}

function isTokenId(value: unknown): value is TokenId {
  return typeof value === 'string' && (KNOWN_TOKEN_IDS as readonly string[]).includes(value)
}

export function sanitizeEnabledTokens(value: unknown): TokenId[] {
  if (!Array.isArray(value)) {
    return [...KNOWN_TOKEN_IDS]
  }

  const next = value.filter(isTokenId)
  return next.length > 0 ? next : [...KNOWN_TOKEN_IDS]
}

export function parseGlowState(raw: unknown): GlowUrlState {
  if (!isRecord(raw)) {
    return { ...DEFAULT_GLOW_STATE }
  }

  const text = typeof raw.text === 'string' ? raw.text : ''
  const byteSize = new Blob([text]).size
  const safeText = byteSize > MAX_TEXT_BYTES ? '' : text

  return {
    text: safeText,
    theme: isThemeId(raw.theme) ? raw.theme : DEFAULT_GLOW_STATE.theme,
    lineNumbers: typeof raw.lineNumbers === 'boolean' ? raw.lineNumbers : DEFAULT_GLOW_STATE.lineNumbers,
    wordWrap: typeof raw.wordWrap === 'boolean' ? raw.wordWrap : DEFAULT_GLOW_STATE.wordWrap,
    fontSize: isFontSizeId(raw.fontSize) ? raw.fontSize : DEFAULT_GLOW_STATE.fontSize,
    enabledTokens: sanitizeEnabledTokens(raw.enabledTokens),
    legendOpen: typeof raw.legendOpen === 'boolean' ? raw.legendOpen : DEFAULT_GLOW_STATE.legendOpen,
  }
}

export type EncodeUrlStateResult =
  | { ok: true; hash: string; encodedLength: number }
  | { ok: false; reason: string }

export function encodeUrlState(state: GlowUrlState): EncodeUrlStateResult {
  try {
    const json = JSON.stringify(state)
    const compressed = LZString.compressToEncodedURIComponent(json)
    if (!compressed) {
      return { ok: false, reason: 'Content is too large to encode in the URL.' }
    }

    const hash = `${URL_STATE_PARAM}=${compressed}`
    if (hash.length > MAX_URL_STATE_CHARS) {
      return { ok: false, reason: 'Content is too large to encode in the URL.' }
    }

    return { ok: true, hash, encodedLength: hash.length }
  } catch {
    return { ok: false, reason: 'Content is too large to encode in the URL.' }
  }
}

export type DecodeUrlStateResult =
  | { ok: true; state: GlowUrlState }
  | { ok: false }

export function decodeUrlState(hash: string): DecodeUrlStateResult {
  if (!hash || hash === '#') {
    return { ok: false }
  }

  try {
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash
    const params = new URLSearchParams(fragment)
    const compressed = params.get(URL_STATE_PARAM)
    if (!compressed) {
      return { ok: false }
    }

    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (typeof json !== 'string' || json.length === 0) {
      return { ok: false }
    }

    const parsed: unknown = JSON.parse(json)
    return { ok: true, state: parseGlowState(parsed) }
  } catch {
    return { ok: false }
  }
}

export function applyHashToUrl(hashFragment: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${hashFragment}`)
}

export function clearUrlHash(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
}
