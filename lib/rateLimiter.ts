/**
 * Client-side input validation and rate limiting.
 */

export const MAX_INPUT_BYTES = 500_000
export const MAX_INPUT_LINES = 50_000
export const MAX_LINE_LENGTH = 5_000

const DEBOUNCE_MS = 300
const MAX_RUNS_PER_WINDOW = 10
const RATE_WINDOW_MS = 10_000
const CONTROL_BYTE_PATTERN = /\x00/
const SUSPICIOUS_REPEAT_PATTERN = /(.)\1{9999,}/

const recentRunTimestamps: number[] = []

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; detail: string }

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterMs: number }

export function validateInput(input: string): ValidationResult {
  if (!input || input.trim() === '') {
    return {
      ok: false,
      reason: 'Input is empty',
      detail: 'Paste or type some log content before processing.',
    }
  }

  const byteSize = new Blob([input]).size
  if (byteSize > MAX_INPUT_BYTES) {
    return {
      ok: false,
      reason: 'Input too large',
      detail: `Input is ${Math.round(byteSize / 1024)} KB. Maximum allowed is ${MAX_INPUT_BYTES / 1024} KB.`,
    }
  }

  const lineCount = input.split('\n').length
  if (lineCount > MAX_INPUT_LINES) {
    return {
      ok: false,
      reason: 'Too many lines',
      detail: `Input has ${lineCount.toLocaleString()} lines. Maximum allowed is ${MAX_INPUT_LINES.toLocaleString()}.`,
    }
  }

  if (CONTROL_BYTE_PATTERN.test(input)) {
    return {
      ok: false,
      reason: 'Invalid input',
      detail: 'Input contains null bytes and cannot be processed.',
    }
  }

  if (SUSPICIOUS_REPEAT_PATTERN.test(input)) {
    return {
      ok: false,
      reason: 'Invalid input',
      detail: 'Input contains suspicious repeated patterns and cannot be processed.',
    }
  }

  return { ok: true }
}

export function checkRateLimit(): RateLimitResult {
  const now = Date.now()

  while (recentRunTimestamps.length > 0 && now - recentRunTimestamps[0] >= RATE_WINDOW_MS) {
    recentRunTimestamps.shift()
  }

  const lastRun = recentRunTimestamps[recentRunTimestamps.length - 1]
  if (typeof lastRun === 'number') {
    const elapsed = now - lastRun
    if (elapsed < DEBOUNCE_MS) {
      return {
        allowed: false,
        reason: 'Processing too frequently',
        retryAfterMs: DEBOUNCE_MS - elapsed,
      }
    }
  }

  if (recentRunTimestamps.length >= MAX_RUNS_PER_WINDOW) {
    const oldestRun = recentRunTimestamps[0]
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfterMs: Math.max(0, RATE_WINDOW_MS - (now - oldestRun)),
    }
  }

  recentRunTimestamps.push(now)
  return { allowed: true }
}

export function getInputStats(
  input: string,
  processingMs: number
): { lines: string; size: string; processingTime: string } {
  const lineCount = input.trim() === '' ? 0 : input.split('\n').length
  const byteSize = new Blob([input]).size

  const size =
    byteSize < 1024
      ? `${byteSize} B`
      : byteSize < 1024 * 1024
        ? `${(byteSize / 1024).toFixed(1)} KB`
        : `${(byteSize / (1024 * 1024)).toFixed(2)} MB`

  return {
    lines: lineCount.toLocaleString(),
    size,
    processingTime: `${processingMs.toFixed(2)}ms`,
  }
}

export function resetRateLimitState(): void {
  recentRunTimestamps.length = 0
}
