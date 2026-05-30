'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OutputErrorBoundary } from '@/components/ErrorBoundary'
import { Icon } from '@/components/glow/Icons'
import { copyToClipboard } from '@/lib/clipboard'
import { fmtInt, type FontSizeId } from '@/lib/glow-utils'

const OVERSCAN = 10
const ROW_HEIGHTS = { S: 19, M: 21, L: 24 } as const

type OutputPanelProps = {
  lineHtml: string[] | null
  rawLines: string[]
  searchQuery: string
  lineNumbers: boolean
  mobile: boolean
  isEmpty: boolean
  isProcessing: boolean
  processingLines: number
  processingProgress: number
  rawText: string
  wrap: boolean
  fontSize: FontSizeId
}

export function OutputPanel({
  lineHtml,
  rawLines,
  searchQuery,
  lineNumbers,
  mobile,
  isEmpty,
  isProcessing,
  processingLines,
  processingProgress,
  rawText,
  wrap,
  fontSize,
}: OutputPanelProps): JSX.Element {
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = (): void => setViewportHeight(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!rawText) return
    const ok = await copyToClipboard(rawText)
    if (ok) {
      setCopyState('done')
      window.setTimeout(() => setCopyState('idle'), 1400)
    } else {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2500)
    }
  }, [rawText])

  const handleDownload = useCallback((): void => {
    if (!rawText) return
    const blob = new Blob([rawText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'glow.log'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [rawText])

  const rowHeight = ROW_HEIGHTS[fontSize]

  const visibleIndices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return rawLines.map((_, i) => i)
    }
    return rawLines.reduce<number[]>((acc, line, i) => {
      if (line.toLowerCase().includes(q)) acc.push(i)
      return acc
    }, [])
  }, [rawLines, searchQuery])

  const lines = lineHtml ?? []
  const pct = Math.round(processingProgress * 100)
  const done = Math.round(processingLines * processingProgress)

  const virtual = useMemo(() => {
    const total = visibleIndices.length
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
    const count = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2
    const end = Math.min(total, start + count)
    return { start, end, total, totalHeight: total * rowHeight, paddingTop: start * rowHeight }
  }, [visibleIndices.length, scrollTop, viewportHeight, rowHeight])

  let outputBody: JSX.Element
  if (isEmpty) {
    outputBody = (
      <div className="gs-out-empty">
        <span className="gs-out-empty-glyph">{Icon.spark}</span>
        <div>
          <div className="gs-out-empty-title">Highlighted output will appear here</div>
          <div className="gs-out-empty-sub">
            Try pasting a log {mobile ? 'above' : 'on the left'}, or drag a&nbsp;
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.log</span> /{' '}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.txt</span> file onto the input.
          </div>
        </div>
        <span className="gs-arrow">{mobile ? '↑ Add input above' : '← Start in the input panel'}</span>
      </div>
    )
  } else if (isProcessing && lines.length === 0) {
    outputBody = (
      <div className="gs-out-processing">
        <div className="gs-processing-text">Highlighting {fmtInt(processingLines)} lines…</div>
        <div className="gs-progress">
          <div className="gs-progress-fill" style={{ transform: `scaleX(${processingProgress})` }} />
        </div>
        <div className="gs-processing-sub">
          {pct}%&nbsp;·&nbsp;{fmtInt(done)} / {fmtInt(processingLines)} lines
        </div>
      </div>
    )
  } else {
    const virtualClass = `gs-out-pre gs-out-virtual${wrap ? ' gs-out-virtual--wrap' : ''}`
    if (wrap) {
      outputBody = (
        <div className={virtualClass} role="log">
          {visibleIndices.map(rawIndex => (
            <div className="gs-out-line" key={rawIndex}>
              {lineNumbers && <span className="gs-ln">{rawIndex + 1}</span>}
              <span
                className="gs-ln-content"
                dangerouslySetInnerHTML={{ __html: lines[rawIndex] ?? '' }}
              />
            </div>
          ))}
          {searchQuery.trim() && visibleIndices.length === 0 ? (
            <div className="gs-out-search-empty">No lines match &quot;{searchQuery.trim()}&quot;</div>
          ) : null}
        </div>
      )
    } else {
      const slice = visibleIndices.slice(virtual.start, virtual.end)
      outputBody = (
        <div
          className={virtualClass}
          style={{ height: virtual.totalHeight, paddingTop: virtual.paddingTop }}
          role="log"
        >
          {slice.map(rawIndex => (
            <div className="gs-out-line" key={rawIndex} style={{ minHeight: rowHeight }}>
              {lineNumbers && <span className="gs-ln">{rawIndex + 1}</span>}
              <span
                className="gs-ln-content"
                dangerouslySetInnerHTML={{ __html: lines[rawIndex] ?? '' }}
              />
            </div>
          ))}
        {searchQuery.trim() && visibleIndices.length === 0 ? (
          <div className="gs-out-search-empty">No lines match &quot;{searchQuery.trim()}&quot;</div>
        ) : null}
      </div>
      )
    }
  }

  const lineCount = lines.length

  return (
    <section className="gs-panel gs-panel-output">
      <div className="gs-panel-head">
        <span className="gs-panel-title">
          <span className="gs-panel-title-dot" />
          Output
          {searchQuery.trim() ? (
            <span className="gs-panel-hint" style={{ marginLeft: 8 }}>
              {fmtInt(visibleIndices.length)} / {fmtInt(rawLines.length)} lines
            </span>
          ) : null}
        </span>
        {!isEmpty && (
          <div className="gs-out-actions">
            <button
              type="button"
              className={`gs-btn${copyState === 'done' ? ' gs-btn-success' : copyState === 'error' ? ' gs-btn-error' : ''}`}
              onClick={() => {
                void handleCopy()
              }}
            >
              {copyState === 'done' ? Icon.check : Icon.copy}
              <span>{copyState === 'done' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy'}</span>
            </button>
            <button type="button" className="gs-btn" onClick={handleDownload}>
              {Icon.download}
              <span>Download</span>
            </button>
          </div>
        )}
      </div>
      <OutputErrorBoundary>
        <div
          className="gs-out-viewport"
          ref={viewportRef}
          role="region"
          aria-label="Highlighted log output"
          onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        >
          {outputBody}
          {isProcessing && lines.length > 0 ? (
            <div className="gs-out-processing-bar" aria-live="polite">
              Highlighting… {pct}%
            </div>
          ) : null}
        </div>
      </OutputErrorBoundary>
      <div className="gs-panel-foot">
        <div className="gs-stats">
          {isProcessing ? (
            <span>processing…</span>
          ) : (
            <>
              <span>
                <strong>{fmtInt(lineCount)}</strong>&nbsp;lines
              </span>
              <span className="gs-stats-dot">·</span>
              <span>UTF-8</span>
            </>
          )}
        </div>
        <div className="gs-stats" style={{ color: 'var(--fg-faint)' }}>
          client-side highlight
        </div>
      </div>
    </section>
  )
}
