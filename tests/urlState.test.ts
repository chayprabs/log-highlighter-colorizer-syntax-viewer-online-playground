import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GLOW_STATE,
  MAX_URL_STATE_CHARS,
  decodeUrlState,
  encodeUrlState,
  parseGlowState,
  type GlowUrlState,
} from '@/lib/urlState'

describe('encodeUrlState / decodeUrlState', () => {
  it('round-trips a minimal state', () => {
    const state: GlowUrlState = {
      ...DEFAULT_GLOW_STATE,
      text: 'hello\nworld',
      theme: 'light',
      lineNumbers: false,
      wordWrap: true,
      fontSize: 'large',
    }
    const enc = encodeUrlState(state)
    expect(enc.ok).toBe(true)
    if (!enc.ok) {
      return
    }
    const dec = decodeUrlState(`#${enc.hash}`)
    expect(dec.ok).toBe(true)
    if (!dec.ok) {
      return
    }
    expect(dec.state.text).toBe(state.text)
    expect(dec.state.theme).toBe('light')
    expect(dec.state.lineNumbers).toBe(false)
    expect(dec.state.wordWrap).toBe(true)
    expect(dec.state.fontSize).toBe('large')
  })

  it('suppresses encoding when payload exceeds size guard', () => {
    const bytes = new Uint8Array(400_000)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    const text = Array.from(bytes, b => String.fromCharCode(b)).join('')
    const enc = encodeUrlState({ ...DEFAULT_GLOW_STATE, text })
    expect(enc.ok).toBe(false)
    if (!enc.ok) {
      expect(enc.reason).toContain('too large')
    }
  })

  it('ignores malformed hash without throwing', () => {
    const dec = decodeUrlState('#state=not-valid-lz')
    expect(dec.ok).toBe(false)
  })
})

describe('parseGlowState', () => {
  it('ignores unknown theme values', () => {
    const parsed = parseGlowState({ theme: 'neon', text: 'ok' })
    expect(parsed.theme).toBe(DEFAULT_GLOW_STATE.theme)
    expect(parsed.text).toBe('ok')
  })

  it('sanitises enabled token list', () => {
    const parsed = parseGlowState({ enabledTokens: ['timestamp', 'bogus'] })
    expect(parsed.enabledTokens).toContain('timestamp')
    expect(parsed.enabledTokens).not.toContain('bogus' as never)
  })
})

describe('MAX_URL_STATE_CHARS', () => {
  it('is 8000 as required by PRD', () => {
    expect(MAX_URL_STATE_CHARS).toBe(8000)
  })
})
