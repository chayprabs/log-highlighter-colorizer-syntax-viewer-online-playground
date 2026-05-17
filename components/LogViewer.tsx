'use client'

import { useCallback, useRef } from 'react'
import { copyToClipboard } from '@/lib/clipboard'

type LogViewerProps = {
  html: string
  rawText: string
  lineNumbers: boolean
  wordWrap: boolean
  fontSize: 'small' | 'medium' | 'large'
  theme: 'dark' | 'light'
  totalLines: number
  isHighlighting: boolean
  copyNotice: boolean
  onCopyNotice: (show: boolean) => void
}

const fontClass = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
} as const

export function LogViewer({
  html,
  rawText,
  lineNumbers,
  wordWrap,
  fontSize,
  theme,
  totalLines,
  isHighlighting,
  copyNotice,
  onCopyNotice,
}: LogViewerProps): JSX.Element {
  const regionRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!rawText) {
      return
    }
    const ok = await copyToClipboard(rawText)
    if (ok) {
      onCopyNotice(true)
      window.setTimeout(() => {
        onCopyNotice(false)
      }, 2000)
    }
  }, [onCopyNotice, rawText])

  const handleDownload = useCallback((): void => {
    if (!rawText) {
      return
    }
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'log-output.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [rawText])

  const surface =
    theme === 'dark'
      ? 'border-neutral-700 bg-neutral-950 text-neutral-100'
      : 'border-neutral-200 bg-white text-neutral-900'

  const gutter =
    lineNumbers && totalLines > 0 ? (
      <pre
        className={`select-none border-r border-neutral-200 bg-neutral-100 px-2 py-3 text-right text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-500 ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
        aria-hidden
      >
        {Array.from({ length: totalLines }, (_, index) => String(index + 1)).join('\n')}
      </pre>
    ) : null

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Output</span>
        <div className="flex flex-wrap items-center gap-2">
          {isHighlighting && totalLines > 0 && (
            <span className="text-xs text-cyan-600 dark:text-cyan-400" role="status" aria-live="polite">
              Highlighting {totalLines.toLocaleString()} lines…
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              void handleCopy()
            }}
            disabled={!rawText}
            className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            {copyNotice ? 'Copied.' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!rawText}
            className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            Download
          </button>
        </div>
      </div>

      <div
        className={`flex min-h-[280px] min-w-0 flex-1 overflow-hidden rounded-lg border font-mono ${fontClass[fontSize]} ${surface}`}
      >
        {gutter}
        <div
          ref={regionRef}
          className={`log-viewer min-h-0 min-w-0 flex-1 overflow-auto p-3 ${theme === 'dark' ? 'log-viewer--dark' : 'log-viewer--light'} ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
          role="region"
          aria-label="Highlighted log output"
        >
          {rawText.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-500">Paste some log output to get started.</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {totalLines.toLocaleString()} lines
      </p>
    </div>
  )
}
