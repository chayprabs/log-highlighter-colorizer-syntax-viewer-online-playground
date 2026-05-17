'use client'

import type { ThemeId, TokenId } from '@/lib/urlState'
import { KNOWN_TOKEN_IDS } from '@/lib/urlState'

const TOKEN_DESC: Record<TokenId, string> = {
  timestamp: 'ISO, syslog, nginx, time-only, and epoch-like timestamps.',
  'level-error': 'Severe log levels such as ERROR, FATAL, and CRITICAL.',
  'level-warn': 'WARN and WARNING keywords.',
  'level-info': 'INFO level keyword.',
  'level-debug': 'DEBUG and TRACE keywords.',
  'status-5xx': 'Three-digit HTTP codes 500–599.',
  'status-4xx': 'HTTP codes 400–499.',
  'status-3xx': 'HTTP codes 300–399.',
  'status-2xx': 'HTTP codes 200–299.',
  'http-method': 'Common HTTP verbs in access logs.',
  url: 'http(s) and ftp URLs (bounded pattern; trailing punctuation trimmed).',
  ip: 'IPv4 addresses with valid octets.',
  uuid: 'Standard UUID format.',
  path: 'Unix-style absolute paths.',
  key: 'Key portion of key=value or key: value pairs.',
  value: 'Value portion of key-value pairs.',
  'json-key': 'Double-quoted keys on valid JSON lines.',
  string: 'Single- and double-quoted strings (length capped for safety).',
  number: 'Standalone integers and decimals.',
  literal: 'true, false, null, undefined, nil.',
}

type TokenLegendProps = {
  theme: ThemeId
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TokenLegend({ theme, open, onOpenChange }: TokenLegendProps): JSX.Element | null {
  if (!open) {
    return null
  }

  return (
    <section
      className={`legend-${theme} mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Token legend</h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-xs text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Collapse
        </button>
      </div>
      <ul className="grid gap-3 text-xs sm:grid-cols-2">
        {KNOWN_TOKEN_IDS.map(id => (
          <li key={id} className="flex gap-2">
            <span
              className={`token-swatch token-${id} mt-0.5 inline-block h-3 w-6 shrink-0 rounded border border-neutral-300 dark:border-neutral-600`}
              aria-hidden
            />
            <div>
              <div className="font-medium text-neutral-800 dark:text-neutral-200">{id.replace(/-/g, ' ')}</div>
              <p className="text-neutral-600 dark:text-neutral-400">{TOKEN_DESC[id]}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
