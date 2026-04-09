/**
 * Shareable URL encoding and decoding for log highlighter state.
 *
 * Strategy:
 *   - Log input is compressed with LZ-string then base64url-encoded
 *   - Encoded state is stored in the URL hash (#) not query params (?)
 *   - Hash is used because:
 *       1. Hash content is never sent to the server (privacy)
 *       2. No server-side handling needed
 *       3. Works on static deployments (GitHub Pages, Cloudflare Pages)
 *
 * URL format:
 *   https://yourdomain.com/#q=<compressed_encoded_input>
 *
 * Size limits:
 *   - Raw input cap for sharing: 50,000 characters
 *   - After compression, typical logs compress to ~10-20% of original size
 *   - A 50KB log typically produces a ~500-char URL fragment
 */

import LZString from 'lz-string'

/** Maximum characters of raw input that can be encoded into a share URL */
export const MAX_SHAREABLE_LENGTH = 50_000

/** The URL hash parameter key used to store the encoded log */
const SHARE_PARAM_KEY = 'q'

// ─── Types ───────────────────────────────────────────────────────────────────

export type EncodeResult =
  | { ok: true; url: string; originalBytes: number; encodedChars: number }
  | { ok: false; reason: string }

export type DecodeResult =
  | { ok: true; input: string }
  | { ok: false; reason: string }

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * Encodes log input into a shareable URL using LZ compression + base64url.
 *
 * @param rawInput - The raw log text from the textarea
 * @param baseUrl - The current page URL (use window.location.href)
 * @returns EncodeResult with the full shareable URL or an error reason
 */
export function encodeShareUrl(rawInput: string, baseUrl: string): EncodeResult {
  if (!rawInput || rawInput.trim() === '') {
    return { ok: false, reason: 'Nothing to share — input is empty.' }
  }

  if (rawInput.length > MAX_SHAREABLE_LENGTH) {
    const kb = Math.round(rawInput.length / 1024)
    return {
      ok: false,
      reason: `Input is too large to share (${kb} KB). Maximum is ${MAX_SHAREABLE_LENGTH / 1000} KB. Try sharing a smaller excerpt.`,
    }
  }

  try {
    // LZString.compressToEncodedURIComponent produces a URL-safe base64 string
    const compressed = LZString.compressToEncodedURIComponent(rawInput)

    if (!compressed) {
      return { ok: false, reason: 'Compression failed. Please try again.' }
    }

    // Build clean base URL (strip any existing hash)
    const urlWithoutHash = baseUrl.split('#')[0]
    const shareUrl = `${urlWithoutHash}#${SHARE_PARAM_KEY}=${compressed}`

    return {
      ok: true,
      url: shareUrl,
      originalBytes: new Blob([rawInput]).size,
      encodedChars: compressed.length,
    }
  } catch {
    return { ok: false, reason: 'Failed to generate share URL. Please try again.' }
  }
}

// ─── Decoding ────────────────────────────────────────────────────────────────

/**
 * Decodes log input from a URL hash fragment.
 * Call this on page load to restore shared state.
 *
 * @param hash - The URL hash string (e.g. window.location.hash)
 * @returns DecodeResult with the restored log input or an error reason
 */
export function decodeShareUrl(hash: string): DecodeResult {
  if (!hash || hash === '#' || hash === '') {
    return { ok: false, reason: 'No shared content in URL.' }
  }

  try {
    // Remove leading # character
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash

    // Parse as URLSearchParams to extract the q parameter
    const params = new URLSearchParams(fragment)
    const compressed = params.get(SHARE_PARAM_KEY)

    if (!compressed) {
      return { ok: false, reason: 'No log content found in URL.' }
    }

    const decompressed = LZString.decompressFromEncodedURIComponent(compressed)

    if (decompressed === null || decompressed === undefined) {
      return { ok: false, reason: 'Failed to decode shared URL. The link may be corrupted or truncated.' }
    }

    if (decompressed === '') {
      return { ok: false, reason: 'Shared content is empty.' }
    }

    if (!/^[\x20-\x7E\x0A\x0D\x09]*$/.test(decompressed)) {
      return { ok: false, reason: 'Failed to decode shared URL. The link may be corrupted or truncated.' }
    }

    return { ok: true, input: decompressed }
  } catch {
    return { ok: false, reason: 'Invalid share URL format.' }
  }
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

/**
 * Copies a string to the clipboard.
 * Returns true if successful, false if clipboard access was denied.
 *
 * @param text - The string to copy
 * @returns Promise<boolean> — true if copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for non-secure contexts (http localhost etc.)
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

// ─── URL Cleanup ─────────────────────────────────────────────────────────────

/**
 * Removes the share hash from the URL without triggering a page reload.
 * Call this after the user clears their input so the URL stays clean.
 */
export function clearShareUrl(): void {
  if (typeof window === 'undefined') return
  const cleanUrl = window.location.pathname + window.location.search
  window.history.replaceState(null, '', cleanUrl)
}