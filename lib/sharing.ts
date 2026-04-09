import LZString from 'lz-string'

export const MAX_SHAREABLE_LENGTH = 50_000

const SHARE_PARAM_KEY = 'q'
const DISALLOWED_CONTROL_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/

export type EncodeResult =
  | { ok: true; url: string; originalBytes: number; encodedChars: number }
  | { ok: false; reason: string }

export type DecodeResult =
  | { ok: true; input: string }
  | { ok: false; reason: string }

export function encodeShareUrl(rawInput: string, baseUrl: string): EncodeResult {
  if (!rawInput || rawInput.trim() === '') {
    return { ok: false, reason: 'Nothing to share - input is empty.' }
  }

  if (rawInput.length > MAX_SHAREABLE_LENGTH) {
    return {
      ok: false,
      reason: `Input is too large to share (${Math.round(rawInput.length / 1024)} KB). Maximum is ${MAX_SHAREABLE_LENGTH / 1000} KB. Try sharing a smaller excerpt.`,
    }
  }

  try {
    const compressed = LZString.compressToEncodedURIComponent(rawInput)
    if (!compressed) {
      return { ok: false, reason: 'Compression failed. Please try again.' }
    }

    const cleanBaseUrl = baseUrl.split('#')[0]
    return {
      ok: true,
      url: `${cleanBaseUrl}#${SHARE_PARAM_KEY}=${compressed}`,
      originalBytes: new Blob([rawInput]).size,
      encodedChars: compressed.length,
    }
  } catch {
    return { ok: false, reason: 'Failed to generate share URL. Please try again.' }
  }
}

export function decodeShareUrl(hash: string): DecodeResult {
  if (!hash || hash === '#') {
    return { ok: false, reason: 'No shared content in URL.' }
  }

  try {
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash
    const params = new URLSearchParams(fragment)
    const compressed = params.get(SHARE_PARAM_KEY)

    if (!compressed) {
      return { ok: false, reason: 'No log content found in URL.' }
    }

    const decompressed = LZString.decompressFromEncodedURIComponent(compressed)
    if (typeof decompressed !== 'string' || decompressed.trim() === '') {
      return { ok: false, reason: 'Failed to decode shared URL. The link may be corrupted or truncated.' }
    }

    if (decompressed.length > MAX_SHAREABLE_LENGTH || DISALLOWED_CONTROL_PATTERN.test(decompressed)) {
      return { ok: false, reason: 'Failed to decode shared URL. The link may be corrupted or truncated.' }
    }

    return { ok: true, input: decompressed }
  } catch {
    return { ok: false, reason: 'Invalid share URL format.' }
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    if (typeof document === 'undefined') {
      return false
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.setAttribute('aria-hidden', 'true')

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

export function clearShareUrl(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
}
