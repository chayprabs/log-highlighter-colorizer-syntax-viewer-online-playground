'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InputPanel, type InputFootState } from '@/components/glow/InputPanel'
import { Legend } from '@/components/glow/Legend'
import { OutputPanel } from '@/components/glow/OutputPanel'
import { ProductToolbar } from '@/components/glow/ProductToolbar'
import { TokenFilters } from '@/components/glow/TokenFilters'
import { SeoBar } from '@/components/site/SeoBar'
import { SiteShell } from '@/components/site/SiteShell'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { EXAMPLE_LOG } from '@/lib/example-log'
import { glowFontToUrl, urlFontToGlow } from '@/lib/font-size-bridge'
import type { FontSizeId, ThemeId } from '@/lib/glow-utils'
import { initialTheme } from '@/lib/glow-utils'
import {
  defaultEnabledTokenSet,
  highlightLinesAsync,
  highlightLinesSync,
  SYNC_LINE_THRESHOLD,
} from '@/lib/highlighter'
import {
  applyHashToUrl,
  clearUrlHash,
  decodeUrlState,
  encodeUrlState,
  sanitizeEnabledTokens,
  type GlowUrlState,
  type TokenId,
} from '@/lib/urlState'

const MOBILE_BREAKPOINT = 640
const URL_SYNC_DEBOUNCE_MS = 300

function buildUrlState(
  input: string,
  theme: ThemeId,
  lineNumbers: boolean,
  wrap: boolean,
  fontSize: FontSizeId,
  legendOpen: boolean,
  enabledTokens: TokenId[]
): GlowUrlState {
  return {
    text: input,
    theme,
    lineNumbers,
    wordWrap: wrap,
    fontSize: glowFontToUrl(fontSize),
    enabledTokens,
    legendOpen,
  }
}

export function GlowApp(): JSX.Element {
  const [theme, setTheme] = useState<ThemeId>('light')
  const [lineNumbers, setLineNumbers] = useState(true)
  const [wrap, setWrap] = useState(false)
  const [fontSize, setFontSize] = useState<FontSizeId>('M')
  const [legendOpen, setLegendOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [urlEncodeError, setUrlEncodeError] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [footState, setFootState] = useState<InputFootState>('normal')
  const [lineHtml, setLineHtml] = useState<string[] | null>(null)
  const [rawLines, setRawLines] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLines, setProcessingLines] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [enabledTokens, setEnabledTokens] = useState<Set<TokenId>>(() => defaultEnabledTokenSet())

  const highlightGenRef = useRef(0)
  const hydratedFromUrlRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTheme(initialTheme())
    const result = decodeUrlState(window.location.hash)
    if (result.ok) {
      const { state } = result
      setInput(state.text)
      setTheme(state.theme)
      setLineNumbers(state.lineNumbers)
      setWrap(state.wordWrap)
      setFontSize(urlFontToGlow(state.fontSize))
      setLegendOpen(state.legendOpen)
      setEnabledTokens(new Set(sanitizeEnabledTokens(state.enabledTokens)))
    }
    hydratedFromUrlRef.current = true
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = (): void => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const isEmpty = input.trim() === ''
  const enabledSet = useMemo(() => enabledTokens, [enabledTokens])

  useEffect(() => {
    const gen = ++highlightGenRef.current
    const controller = new AbortController()

    const run = async (): Promise<void> => {
      if (isEmpty) {
        if (highlightGenRef.current === gen) {
          setLineHtml(null)
          setRawLines([])
          setIsProcessing(false)
        }
        return
      }

      const lineCount = input.split('\n').length
      setRawLines(input.split('\n'))

      if (lineCount > SYNC_LINE_THRESHOLD) {
        if (highlightGenRef.current === gen) {
          setIsProcessing(true)
          setProcessingLines(lineCount)
          setProcessingProgress(0)
          setLineHtml([])
        }

        try {
          const result = await highlightLinesAsync(input, {
            enabledTokens: enabledSet,
            signal: controller.signal,
            onProgress: (done, total, partial) => {
              if (highlightGenRef.current === gen) {
                setLineHtml([...partial])
                setProcessingProgress(done / total)
              }
            },
          })
          if (highlightGenRef.current === gen) {
            setLineHtml(result)
            setProcessingProgress(1)
          }
        } finally {
          if (highlightGenRef.current === gen) {
            setIsProcessing(false)
          }
        }
        return
      }

      const result = highlightLinesSync(input, enabledSet)
      if (highlightGenRef.current === gen) {
        setLineHtml(result)
        setIsProcessing(false)
      }
    }

    const schedule = (): void => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => void run(), { timeout: 100 })
      } else {
        queueMicrotask(() => void run())
      }
    }
    schedule()

    return () => {
      controller.abort()
    }
  }, [input, isEmpty, enabledSet])

  useEffect(() => {
    if (!hydratedFromUrlRef.current) return

    const timer = window.setTimeout(() => {
      if (isEmpty) {
        if (window.location.hash) clearUrlHash()
        setUrlEncodeError(null)
        return
      }

      const encoded = encodeUrlState(
        buildUrlState(input, theme, lineNumbers, wrap, fontSize, legendOpen, Array.from(enabledTokens))
      )
      if (encoded.ok) {
        applyHashToUrl(encoded.hash)
        setUrlEncodeError(null)
      } else {
        setUrlEncodeError(encoded.reason)
      }
    }, URL_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [input, theme, lineNumbers, wrap, fontSize, legendOpen, enabledTokens, isEmpty])

  const shellClass = useMemo(() => {
    const parts = ['glow-shell', `fs-${fontSize}`]
    if (lineNumbers) parts.push('has-gutter')
    if (wrap) parts.push('is-wrap')
    if (mobile) parts.push('is-mobile')
    return parts.join(' ')
  }, [fontSize, lineNumbers, wrap, mobile])

  const handleClear = useCallback((): void => {
    setInput('')
    setFootState('normal')
    setSearchQuery('')
  }, [])

  const handleLoadExample = useCallback((): void => {
    setFootState('normal')
    setInput(EXAMPLE_LOG)
  }, [])

  const handleShare = useCallback((): { ok: boolean; message: string } => {
    if (isEmpty) {
      return { ok: false, message: 'Add log content before sharing.' }
    }

    const encoded = encodeUrlState(
      buildUrlState(input, theme, lineNumbers, wrap, fontSize, legendOpen, Array.from(enabledTokens))
    )
    if (!encoded.ok) {
      return { ok: false, message: encoded.reason }
    }

    applyHashToUrl(encoded.hash)
    return { ok: true, message: '' }
  }, [input, theme, lineNumbers, wrap, fontSize, legendOpen, enabledTokens, isEmpty])

  const handleToggleToken = useCallback((id: TokenId): void => {
    setEnabledTokens(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next.size > 0 ? next : new Set([id])
    })
  }, [])

  const handleEnableAllTokens = useCallback((): void => {
    setEnabledTokens(defaultEnabledTokenSet())
  }, [])

  const handleDisableAllTokens = useCallback((): void => {
    setEnabledTokens(new Set<TokenId>(['timestamp']))
  }, [])

  const focusInput = useCallback((): void => {
    inputRef.current?.focus()
  }, [])

  useKeyboardShortcuts({
    onFocusInput: focusInput,
    onLoadExample: handleLoadExample,
    onClear: handleClear,
  })

  return (
    <SiteShell showSeoBar seoBar={<SeoBar />}>
      <div className={shellClass} data-theme={theme}>
        <ProductToolbar
          theme={theme}
          onThemeToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          lineNumbers={lineNumbers}
          onLineNumbersToggle={() => setLineNumbers(v => !v)}
          wrap={wrap}
          onWrapToggle={() => setWrap(v => !v)}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          legendOpen={legendOpen}
          onLegendToggle={() => setLegendOpen(v => !v)}
          filtersOpen={filtersOpen}
          onFiltersToggle={() => setFiltersOpen(v => !v)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mobile={mobile}
          onShare={handleShare}
        />
        {urlEncodeError ? (
          <p className="gs-url-error" role="status">
            {urlEncodeError}
          </p>
        ) : null}
        <TokenFilters
          open={filtersOpen}
          enabled={enabledTokens}
          onToggle={handleToggleToken}
          onEnableAll={handleEnableAllTokens}
          onDisableAll={handleDisableAllTokens}
        />
        <Legend open={legendOpen} />
        <main className="gs-main">
          <InputPanel
            ref={inputRef}
            value={input}
            onChange={setInput}
            onClear={handleClear}
            onLoadExample={handleLoadExample}
            footState={footState}
            onFootStateChange={setFootState}
          />
          <OutputPanel
            lineHtml={lineHtml}
            rawLines={rawLines}
            searchQuery={searchQuery}
            lineNumbers={lineNumbers}
            mobile={mobile}
            isEmpty={isEmpty}
            isProcessing={isProcessing}
            processingLines={processingLines}
            processingProgress={processingProgress}
            rawText={input}
            wrap={wrap}
            fontSize={fontSize}
          />
        </main>
      </div>
    </SiteShell>
  )
}
