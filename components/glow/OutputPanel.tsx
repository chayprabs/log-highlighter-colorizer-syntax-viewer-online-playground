'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/glow/Icons'
import { Tokens } from '@/components/glow/Tokens'
import { copyToClipboard } from '@/lib/clipboard'
import { fmtInt } from '@/lib/glow-utils'
import type { Token } from '@/lib/tokenize'

type OutputPanelProps = {
  lines: Token[][] | null
  rawText: string
  lineNumbers: boolean
  mobile: boolean
  isEmpty: boolean
  isProcessing: boolean
  processingLines: number
  processingProgress: number
}

export function OutputPanel({
  lines,
  rawText,
  lineNumbers,
  mobile,
  isEmpty,
  isProcessing,
  processingLines,
  processingProgress,
}: OutputPanelProps): JSX.Element {
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle')

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!rawText) return
    const ok = await copyToClipboard(rawText)
    if (ok) {
      setCopyState('done')
      window.setTimeout(() => setCopyState('idle'), 1400)
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

  const lineCount = lines?.length ?? 0
  const pct = Math.round(processingProgress * 100)
  const done = Math.round(processingLines * processingProgress)

  let outputBody: JSX.Element
  if (isEmpty) {
    outputBody = (
      <div className="gs-out-empty">
        <span className="gs-out-empty-glyph">{Icon.spark}</span>
        <div>
          <div className="gs-out-empty-title">Highlighted output will appear here</div>
          <div className="gs-out-empty-sub">
            Try pasting a log on the left, or drag a&nbsp;
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.log</span> /{' '}
            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.txt</span> file onto the input.
          </div>
        </div>
        <span className="gs-arrow">{mobile ? '↑ Add input above' : '← Start in the input panel'}</span>
      </div>
    )
  } else if (isProcessing) {
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
    outputBody = (
      <pre className="gs-out-pre">
        {(lines ?? []).map((toks, i) => (
          <div className="gs-out-line" key={i}>
            {lineNumbers && <span className="gs-ln">{i + 1}</span>}
            <span className="gs-ln-content">
              <Tokens tokens={toks} />
            </span>
          </div>
        ))}
      </pre>
    )
  }

  return (
    <section className="gs-panel gs-panel-output">
      <div className="gs-panel-head">
        <span className="gs-panel-title">
          <span className="gs-panel-title-dot" />
          Output
        </span>
        {!isEmpty && !isProcessing && (
          <div className="gs-out-actions">
            <button
              type="button"
              className={`gs-btn${copyState === 'done' ? ' gs-btn-success' : ''}`}
              onClick={() => {
                void handleCopy()
              }}
            >
              {copyState === 'done' ? Icon.check : Icon.copy}
              <span>{copyState === 'done' ? 'Copied' : 'Copy'}</span>
            </button>
            <button type="button" className="gs-btn" onClick={handleDownload}>
              {Icon.download}
              <span>Download</span>
            </button>
          </div>
        )}
      </div>
      <div className="gs-out-viewport" role="region" aria-label="Highlighted log output">
        {outputBody}
      </div>
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
          plain text
        </div>
      </div>
    </section>
  )
}
