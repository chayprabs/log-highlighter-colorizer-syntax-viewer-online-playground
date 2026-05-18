'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { OutputErrorBoundary } from '@/components/ErrorBoundary'
import { LogInput } from '@/components/LogInput'
import { LogViewer } from '@/components/LogViewer'
import { TokenLegend } from '@/components/TokenLegend'
import { Toolbar } from '@/components/Toolbar'
import { copyToClipboard } from '@/lib/clipboard'
import { defaultEnabledTokenSet, highlightLogAsync, sanitizeInput, SYNC_LINE_THRESHOLD } from '@/lib/highlighter'
import {
  applyHashToUrl,
  clearUrlHash,
  decodeUrlState,
  encodeUrlState,
  URL_STATE_PARAM,
  type FontSizeId,
  type GlowUrlState,
  type ThemeId,
  type TokenId,
} from '@/lib/urlState'

const SAMPLE_LOG = `2024-01-15T10:30:45.123Z INFO Starting application server
192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users?id=123 HTTP/1.1" 200 1234
Jan 15 10:30:45 WARN slow query user_id=550e8400-e29b-41d4-a716-446655440000 region="us-east-1"
ERROR FATAL: disk full at /var/log/system.log
https://cdn.example.com/v2/asset.tar.gz?token=abc host: example.com
1705312245.123 DEBUG trace_id=abc-123 null=false
CRITICAL: PATCH /internal/repair HTTP/1.1 503`

const URL_DEBOUNCE_MS = 300

function buildState(
  text: string,
  theme: ThemeId,
  lineNumbers: boolean,
  wordWrap: boolean,
  fontSize: FontSizeId,
  enabledTokens: Set<TokenId>,
  legendOpen: boolean
): GlowUrlState {
  return {
    text,
    theme,
    lineNumbers,
    wordWrap,
    fontSize,
    enabledTokens: Array.from(enabledTokens),
    legendOpen,
  }
}

export default function Home(): JSX.Element {
  const [input, setInput] = useState('')
  const [theme, setTheme] = useState<ThemeId>('dark')
  const [lineNumbers, setLineNumbers] = useState(true)
  const [wordWrap, setWordWrap] = useState(false)
  const [fontSize, setFontSize] = useState<FontSizeId>('medium')
  const [enabledTokens, setEnabledTokens] = useState<Set<TokenId>>(() => defaultEnabledTokenSet())
  const [legendOpen, setLegendOpen] = useState(true)

  const [html, setHtml] = useState('')
  const [isHighlighting, setIsHighlighting] = useState(false)
  const [copyNotice, setCopyNotice] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [urlEncodeError, setUrlEncodeError] = useState<string | null>(null)
  const [invalidShareLink, setInvalidShareLink] = useState(false)

  const urlTimerRef = useRef<number | null>(null)
  const urlHydratedRef = useRef(false)
  const highlightGenRef = useRef(0)

  const sanitized = useMemo(() => sanitizeInput(input), [input])
  const lineCount = useMemo(() => {
    if (sanitized.length === 0) {
      return 0
    }
    return sanitized.split('\n').length
  }, [sanitized])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const hash = window.location.hash
    const decoded = decodeUrlState(hash)
    if (decoded.ok) {
      const s = decoded.state
      setInput(s.text)
      setTheme(s.theme)
      setLineNumbers(s.lineNumbers)
      setWordWrap(s.wordWrap)
      setFontSize(s.fontSize)
      setEnabledTokens(new Set(s.enabledTokens))
      setLegendOpen(s.legendOpen)
    } else if (hash.length > 1) {
      const fragment = hash.startsWith('#') ? hash.slice(1) : hash
      const params = new URLSearchParams(fragment)
      if (params.get(URL_STATE_PARAM)) {
        setInvalidShareLink(true)
      }
    }
    urlHydratedRef.current = true
  }, [])

  useEffect(() => {
    const gen = ++highlightGenRef.current
    const controller = new AbortController()

    const run = async (): Promise<void> => {
      if (sanitized.length === 0) {
        if (highlightGenRef.current === gen) {
          setHtml('')
          setIsHighlighting(false)
        }
        return
      }

      const lines = sanitized.split('\n').length
      const needsChunk = lines > SYNC_LINE_THRESHOLD
      if (needsChunk && highlightGenRef.current === gen) {
        setIsHighlighting(true)
      }

      try {
        const next = await highlightLogAsync(sanitized, {
          enabledTokens,
          signal: controller.signal,
        })
        if (highlightGenRef.current !== gen) {
          return
        }
        setHtml(next)
      } finally {
        if (highlightGenRef.current === gen) {
          setIsHighlighting(false)
        }
      }
    }

    void run()
    return () => {
      controller.abort()
    }
  }, [sanitized, enabledTokens])

  const clearUrlTimer = useCallback((): void => {
    if (urlTimerRef.current !== null) {
      window.clearTimeout(urlTimerRef.current)
      urlTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !urlHydratedRef.current) {
      return
    }

    clearUrlTimer()
    urlTimerRef.current = window.setTimeout(() => {
      const state = buildState(input, theme, lineNumbers, wordWrap, fontSize, enabledTokens, legendOpen)
      const encoded = encodeUrlState(state)
      if (!encoded.ok) {
        setUrlEncodeError(encoded.reason)
        return
      }
      setUrlEncodeError(null)
      applyHashToUrl(encoded.hash)
    }, URL_DEBOUNCE_MS)

    return clearUrlTimer
  }, [clearUrlTimer, enabledTokens, fontSize, input, legendOpen, lineNumbers, theme, wordWrap])

  const handleToggleToken = useCallback((id: TokenId, enabled: boolean): void => {
    setEnabledTokens(prev => {
      const next = new Set(prev)
      if (enabled) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleClear = useCallback((): void => {
    setInput('')
    setFileError(null)
    clearUrlHash()
  }, [])

  const handleShare = useCallback(async (): Promise<void> => {
    const state = buildState(input, theme, lineNumbers, wordWrap, fontSize, enabledTokens, legendOpen)
    const encoded = encodeUrlState(state)
    if (!encoded.ok) {
      setUrlEncodeError(encoded.reason)
      return
    }
    setUrlEncodeError(null)
    applyHashToUrl(encoded.hash)
    const ok = await copyToClipboard(window.location.href)
    if (!ok) {
      setUrlEncodeError('Could not copy URL to the clipboard.')
    }
  }, [enabledTokens, fontSize, input, legendOpen, lineNumbers, theme, wordWrap])

  const outerClass =
    theme === 'dark'
      ? 'dark min-h-screen bg-neutral-950 text-neutral-100'
      : 'min-h-screen bg-neutral-50 text-neutral-900'

  return (
    <div data-shell-theme={theme} className={outerClass}>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-500 dark:text-cyan-400">Glow</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Browser-based log syntax highlighter — paste, inspect, share locally.
          </p>
        </header>

        {invalidShareLink && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-2 rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between dark:border-amber-600/40 dark:bg-amber-950/30"
          >
            <p className="text-amber-200 dark:text-amber-100">
              This shared link could not be restored — it may be corrupted, truncated, or from an incompatible version.
              You can still paste your log below.
            </p>
            <button
              type="button"
              onClick={() => setInvalidShareLink(false)}
              className="shrink-0 self-start rounded border border-amber-600/60 px-2 py-1 text-xs font-medium text-amber-100 hover:bg-amber-900/50 sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        <p className="mb-4 rounded-md border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200 dark:border-emerald-700/50 dark:bg-emerald-950/40">
          Nothing leaves your browser. Log content is processed locally. No data is sent to any server.
        </p>

        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-500">
          Your log content is included in this link when you use Share link (stored in the URL hash only — never sent to
          the server).
        </p>

        <Toolbar
          theme={theme}
          onThemeChange={setTheme}
          lineNumbers={lineNumbers}
          onLineNumbersChange={setLineNumbers}
          wordWrap={wordWrap}
          onWordWrapChange={setWordWrap}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          enabledTokens={enabledTokens}
          onToggleToken={handleToggleToken}
          legendOpen={legendOpen}
          onLegendOpenChange={setLegendOpen}
          onShare={handleShare}
          shareDisabled={input.trim() === ''}
          urlEncodeError={urlEncodeError}
        />

        <TokenLegend theme={theme} open={legendOpen} onOpenChange={setLegendOpen} />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col lg:max-w-[50%]">
            <LogInput
              value={input}
              onChange={setInput}
              onClear={handleClear}
              onLoadExample={() => {
                setFileError(null)
                setInput(SAMPLE_LOG)
              }}
              fileError={fileError}
              onFileError={setFileError}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <OutputErrorBoundary>
              <LogViewer
                html={html}
                rawText={sanitized}
                lineNumbers={lineNumbers}
                wordWrap={wordWrap}
                fontSize={fontSize}
                theme={theme}
                totalLines={lineCount}
                isHighlighting={isHighlighting}
                copyNotice={copyNotice}
                onCopyNotice={setCopyNotice}
              />
            </OutputErrorBoundary>
          </div>
        </div>

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          <div className="flex flex-wrap gap-4">
            <a className="underline hover:text-cyan-600 dark:hover:text-cyan-400" href="/privacy">
              Privacy
            </a>
            <a className="underline hover:text-cyan-600 dark:hover:text-cyan-400" href="/terms">
              Terms of service
            </a>
            <a className="underline hover:text-cyan-600 dark:hover:text-cyan-400" href="/terms#terms-of-use">
              Terms of use
            </a>
            <a className="underline hover:text-cyan-600 dark:hover:text-cyan-400" href="/credits">
              Credits
            </a>
          </div>
          <p className="mt-4">© 2026 Chaitanya Prabuddha — MIT License</p>
        </footer>
      </main>
    </div>
  )
}
