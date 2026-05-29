'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InputPanel, type InputFootState } from '@/components/glow/InputPanel'
import { Legend } from '@/components/glow/Legend'
import { OutputPanel } from '@/components/glow/OutputPanel'
import { ProductToolbar } from '@/components/glow/ProductToolbar'
import { SeoBar } from '@/components/site/SeoBar'
import { SiteShell } from '@/components/site/SiteShell'
import { EXAMPLE_LOG } from '@/lib/example-log'
import { glowFontToUrl, urlFontToGlow } from '@/lib/font-size-bridge'
import type { FontSizeId, ThemeId } from '@/lib/glow-utils'
import { initialTheme } from '@/lib/glow-utils'
import { SYNC_LINE_THRESHOLD, tokenize, tokenizeAsync, type Token } from '@/lib/tokenize'
import {
  applyHashToUrl,
  clearUrlHash,
  decodeUrlState,
  DEFAULT_GLOW_STATE,
  encodeUrlState,
  type GlowUrlState,
} from '@/lib/urlState'

const MOBILE_BREAKPOINT = 640
const URL_SYNC_DEBOUNCE_MS = 300

function buildUrlState(
  input: string,
  theme: ThemeId,
  lineNumbers: boolean,
  wrap: boolean,
  fontSize: FontSizeId,
  legendOpen: boolean
): GlowUrlState {
  return {
    text: input,
    theme,
    lineNumbers,
    wordWrap: wrap,
    fontSize: glowFontToUrl(fontSize),
    enabledTokens: [...DEFAULT_GLOW_STATE.enabledTokens],
    legendOpen,
  }
}

export function GlowApp(): JSX.Element {
  const [theme, setTheme] = useState<ThemeId>('light')
  const [lineNumbers, setLineNumbers] = useState(true)
  const [wrap, setWrap] = useState(false)
  const [fontSize, setFontSize] = useState<FontSizeId>('M')
  const [legendOpen, setLegendOpen] = useState(false)
  const [mobile, setMobile] = useState(false)

  const [input, setInput] = useState('')
  const [footState, setFootState] = useState<InputFootState>('normal')
  const [lines, setLines] = useState<Token[][] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLines, setProcessingLines] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)

  const highlightGenRef = useRef(0)
  const hydratedFromUrlRef = useRef(false)

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

  useEffect(() => {
    const gen = ++highlightGenRef.current
    const controller = new AbortController()

    const run = async (): Promise<void> => {
      if (isEmpty) {
        if (highlightGenRef.current === gen) {
          setLines(null)
          setIsProcessing(false)
        }
        return
      }

      const lineCount = input.split('\n').length
      if (lineCount > SYNC_LINE_THRESHOLD) {
        if (highlightGenRef.current === gen) {
          setIsProcessing(true)
          setProcessingLines(lineCount)
          setProcessingProgress(0)
          setLines(null)
        }

        try {
          const result = await tokenizeAsync(
            input,
            (done, total) => {
              if (highlightGenRef.current === gen) {
                setProcessingProgress(done / total)
              }
            },
            controller.signal
          )
          if (highlightGenRef.current === gen) {
            setLines(result)
            setProcessingProgress(1)
          }
        } finally {
          if (highlightGenRef.current === gen) {
            setIsProcessing(false)
          }
        }
        return
      }

      const result = tokenize(input)
      if (highlightGenRef.current === gen) {
        setLines(result)
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
  }, [input, isEmpty])

  useEffect(() => {
    if (!hydratedFromUrlRef.current) return

    const timer = window.setTimeout(() => {
      if (isEmpty) {
        if (window.location.hash) clearUrlHash()
        return
      }

      const encoded = encodeUrlState(buildUrlState(input, theme, lineNumbers, wrap, fontSize, legendOpen))
      if (encoded.ok) {
        applyHashToUrl(encoded.hash)
      }
    }, URL_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [input, theme, lineNumbers, wrap, fontSize, legendOpen, isEmpty])

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
  }, [])

  const handleLoadExample = useCallback((): void => {
    setFootState('normal')
    setInput(EXAMPLE_LOG)
  }, [])

  const handleShare = useCallback((): { ok: boolean; message: string } => {
    if (isEmpty) {
      return { ok: false, message: 'Add log content before sharing.' }
    }

    const encoded = encodeUrlState(buildUrlState(input, theme, lineNumbers, wrap, fontSize, legendOpen))
    if (!encoded.ok) {
      return { ok: false, message: encoded.reason }
    }

    applyHashToUrl(encoded.hash)
    return { ok: true, message: '' }
  }, [input, theme, lineNumbers, wrap, fontSize, legendOpen, isEmpty])

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
          mobile={mobile}
          onShare={handleShare}
        />
        <Legend open={legendOpen} />
        <main className="gs-main">
          <InputPanel
            value={input}
            onChange={setInput}
            onClear={handleClear}
            onLoadExample={handleLoadExample}
            footState={footState}
            onFootStateChange={setFootState}
          />
          <OutputPanel
            lines={lines}
            rawText={input}
            lineNumbers={lineNumbers}
            mobile={mobile}
            isEmpty={isEmpty}
            isProcessing={isProcessing}
            processingLines={processingLines}
            processingProgress={processingProgress}
          />
        </main>
      </div>
    </SiteShell>
  )
}
