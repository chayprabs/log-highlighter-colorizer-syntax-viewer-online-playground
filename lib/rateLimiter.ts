/**
 * Client-side rate limiting and input size enforcement.
 *
 * Since this tool runs entirely in the browser with no backend,
 * rate limiting here is a UX and abuse-prevention layer — it prevents
 * the browser from being overwhelmed by rapid large inputs, and gives
 * clear feedback when limits are exceeded.
 */

// ─── Size Limits ────────────────────────────────────────────────────────────

/** Maximum allowed input size in bytes before processing is refused */
export const MAX_INPUT_BYTES = 500_000 // 500 KB

/** Maximum allowed number of lines before processing is refused */
export const MAX_INPUT_LINES = 50_000

/** Maximum allowed characters per line before that line is skipped */
export const MAX_LINE_LENGTH = 5_000

// ─── Rate Limiting ──────────────────────────────────────────────────────────

/** Minimum milliseconds between processing runs */
const DEBOUNCE_MS = 300

/** Maximum number of processing runs allowed per window */
const MAX_RUNS_PER_WINDOW = 10

/** Duration of the rate limit window in milliseconds */
const RATE_WINDOW_MS = 10_000 // 10 seconds

// ─── State ──────────────────────────────────────────────────────────────────

let lastRunTime = 0
let runCount = 0
let windowStart = Date.now()

// ─── Types ──────────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; detail: string }

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterMs: number }

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Validates user input against size and content limits before processing.
 * Returns a ValidationResult indicating whether the input is safe to process.
 *
 * @param input - The raw string from the textarea
 * @returns ValidationResult — ok: true if safe, ok: false with reason if not
 */
export function validateInput(input: string): ValidationResult {
  const byteSize = new Blob([input]).size
  if (byteSize > MAX_INPUT_BYTES) {
    const kb = Math.round(byteSize / 1024)
    return {
      ok: false,
      reason: 'Input too large',
      detail: `Input is ${kb} KB. Maximum allowed is ${MAX_INPUT_BYTES / 1024} KB.`,
    }
  }

  const lineCount = (input.match(/\n/g) ?? []).length + 1
  if (lineCount > MAX_INPUT_LINES) {
    return {
      ok: false,
      reason: 'Too many lines',
      detail: `Input has ${lineCount.toLocaleString()} lines. Maximum allowed is ${MAX_INPUT_LINES.toLocaleString()}.`,
    }
  }

  if (input.includes('\x00')) {
    return {
      ok: false,
      reason: 'Invalid input',
      detail: 'Input contains null bytes and cannot be processed.',
    }
  }

  if (/(.)\1{9999,}/.test(input)) {
    return {
      ok: false,
      reason: 'Invalid input',
      detail: 'Input contains suspicious repeated patterns and cannot be processed.',
    }
  }

  return { ok: true }
}

/**
 * Checks whether a new processing run is allowed under the rate limit.
 * Updates internal counters if the run is allowed.
 * Must be called immediately before each processing run.
 *
 * Rate limit: maximum 10 processing runs per 10-second window,
 * with a minimum 300ms gap between any two runs.
 *
 * @returns RateLimitResult — allowed: true if run can proceed
 */
export function checkRateLimit(): RateLimitResult {
  const now = Date.now()

  if (now - windowStart > RATE_WINDOW_MS) {
    windowStart = now
    runCount = 0
  }

  const msSinceLast = now - lastRunTime
  if (msSinceLast < DEBOUNCE_MS) {
    return {
      allowed: false,
      reason: 'Processing too frequently',
      retryAfterMs: DEBOUNCE_MS - msSinceLast,
    }
  }

  if (runCount >= MAX_RUNS_PER_WINDOW) {
    const retryAfterMs = RATE_WINDOW_MS - (now - windowStart)
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfterMs,
    }
  }

  lastRunTime = now
  runCount++
  return { allowed: true }
}

/**
 * Returns a human-readable summary of the current input stats.
 * Used to display line count, size, and processing time in the UI.
 *
 * @param input - The raw input string
 * @param processingMs - How long the last processing run took
 * @returns Object with formatted stats strings
 */
export function getInputStats(input: string, processingMs: number): {
  lines: string
  size: string
  processingTime: string
} {
  const lineCount = input.trim() === '' ? 0 : (input.match(/\n/g) ?? []).length + 1
  const byteSize = new Blob([input]).size

  const sizeStr =
    byteSize < 1024
      ? `${byteSize} B`
      : byteSize < 1024 * 1024
        ? `${(byteSize / 1024).toFixed(1)} KB`
        : `${(byteSize / (1024 * 1024)).toFixed(2)} MB`

  return {
    lines: lineCount.toLocaleString(),
    size: sizeStr,
    processingTime: `${processingMs}ms`,
  }
}