'use client'

import type { FontSizeId, ThemeId, TokenId } from '@/lib/urlState'
import { KNOWN_TOKEN_IDS } from '@/lib/urlState'

const TOKEN_LABEL: Record<TokenId, string> = {
  timestamp: 'Timestamps / dates',
  'level-error': 'ERROR / FATAL / CRITICAL',
  'level-warn': 'WARN / WARNING',
  'level-info': 'INFO',
  'level-debug': 'DEBUG / TRACE',
  'status-5xx': 'HTTP 5xx',
  'status-4xx': 'HTTP 4xx',
  'status-3xx': 'HTTP 3xx',
  'status-2xx': 'HTTP 2xx',
  'http-method': 'HTTP methods',
  url: 'URLs',
  ip: 'IPv4',
  uuid: 'UUIDs',
  path: 'Unix paths',
  key: 'Key-value keys',
  value: 'Key-value values',
  'json-key': 'JSON keys',
  string: 'Quoted strings',
  number: 'Numbers',
  literal: 'Boolean / null',
}

type ToolbarProps = {
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
  lineNumbers: boolean
  onLineNumbersChange: (value: boolean) => void
  wordWrap: boolean
  onWordWrapChange: (value: boolean) => void
  fontSize: FontSizeId
  onFontSizeChange: (value: FontSizeId) => void
  enabledTokens: Set<TokenId>
  onToggleToken: (id: TokenId, enabled: boolean) => void
  legendOpen: boolean
  onLegendOpenChange: (open: boolean) => void
  onShare: () => void
  shareDisabled: boolean
  urlEncodeError: string | null
}

export function Toolbar({
  theme,
  onThemeChange,
  lineNumbers,
  onLineNumbersChange,
  wordWrap,
  onWordWrapChange,
  fontSize,
  onFontSizeChange,
  enabledTokens,
  onToggleToken,
  legendOpen,
  onLegendOpenChange,
  onShare,
  shareDisabled,
  urlEncodeError,
}: ToolbarProps): JSX.Element {
  return (
    <div className="mb-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Toolbar
        </span>
        <label className="flex items-center gap-1.5 text-sm text-neutral-800 dark:text-neutral-200">
          <span>Theme</span>
          <select
            value={theme}
            onChange={event => onThemeChange(event.target.value as ThemeId)}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={lineNumbers}
            onChange={event => onLineNumbersChange(event.target.checked)}
          />
          Line numbers
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={wordWrap}
            onChange={event => onWordWrapChange(event.target.checked)}
          />
          Word wrap
        </label>
        <label className="flex items-center gap-1.5 text-sm text-neutral-800 dark:text-neutral-200">
          <span>Font</span>
          <select
            value={fontSize}
            onChange={event => onFontSizeChange(event.target.value as FontSizeId)}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => onLegendOpenChange(!legendOpen)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
        >
          {legendOpen ? 'Hide legend' : 'Legend'}
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={shareDisabled}
          className="rounded-md border border-cyan-700 bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share link
        </button>
      </div>

      {urlEncodeError && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          {urlEncodeError}
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-700 dark:text-neutral-300">Token filters</summary>
        <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {KNOWN_TOKEN_IDS.map(id => (
            <label key={id} className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={enabledTokens.has(id)}
                onChange={event => onToggleToken(id, event.target.checked)}
              />
              <span className="truncate">{TOKEN_LABEL[id]}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  )
}
