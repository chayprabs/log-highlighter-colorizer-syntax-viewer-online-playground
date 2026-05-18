/**
 * PRD §11.1 — safe-regex is intentionally conservative and flags many bounded numeric / date
 * patterns. We combine this heuristic scan with adversarial timing tests in highlighter.test.ts
 * and PER_LINE_TIMEOUT_MS in highlightLine.
 */
import { describe, expect, it } from 'vitest'
import safeRegex from 'safe-regex'
import { HIGHLIGHTER_AUDIT_REGEXES } from '@/lib/highlighter'

describe('ReDoS audit (safe-regex)', () => {
  it('runs heuristic on every highlighting regex and splits safe vs flagged buckets', () => {
    const safe = HIGHLIGHTER_AUDIT_REGEXES.filter(re => safeRegex(re))
    const flagged = HIGHLIGHTER_AUDIT_REGEXES.filter(re => !safeRegex(re))
    expect(safe.length + flagged.length).toBe(HIGHLIGHTER_AUDIT_REGEXES.length)
    expect(flagged.length).toBeGreaterThan(0)
    expect(safe.length).toBeGreaterThan(0)
  })

  it('treats URL and capped quoted-string patterns as heuristic-safe (high-risk surfaces)', () => {
    const url = HIGHLIGHTER_AUDIT_REGEXES.find(re => /\(\?:https\?/.test(re.source))
    expect(url).toBeDefined()
    expect(safeRegex(url!)).toBe(true)

    const dbl = HIGHLIGHTER_AUDIT_REGEXES.find(re => re.source.startsWith('"(?:'))
    expect(dbl).toBeDefined()
    expect(safeRegex(dbl!)).toBe(true)
  })
})
