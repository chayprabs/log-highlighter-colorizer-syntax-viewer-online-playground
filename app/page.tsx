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

  const urlTimerRef = useRef<number | null>(null)
  const urlHydratedRef = useRef(false)

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
    const decoded = decodeUrlState(window.location.hash)
    if (decoded.ok) {
      const s = decoded.state
      setInput(s.text)
      setTheme(s.theme)
      setLineNumbers(s.lineNumbers)
      setWordWrap(s.wordWrap)
      setFontSize(s.fontSize)
      setEnabledTokens(new Set(s.enabledTokens))
      setLegendOpen(s.legendOpen)
    }
    urlHydratedRef.current = true
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const run = async (): Promise<void> => {
      if (sanitized.length === 0) {
        setHtml('')
        setIsHighlighting(false)
        return
      }

      const lines = sanitized.split('\n').length
      const needsChunk = lines > SYNC_LINE_THRESHOLD
      if (needsChunk) {
        setIsHighlighting(true)
      }

      try {
        const next = await highlightLogAsync(sanitized, {
          enabledTokens,
          signal: controller.signal,
        })
        if (!controller.signal.aborted) {
          setHtml(next)
        }
      } finally {
        setIsHighlighting(false)
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
    <div className={outerClass}>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-cyan-500 dark:text-cyan-400">Glow</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Browser-based log syntax highlighter — paste, inspect, share locally.
          </p>
        </header>

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
              Terms
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
