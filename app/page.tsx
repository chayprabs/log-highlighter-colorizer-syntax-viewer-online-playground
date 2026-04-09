'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { highlightLog, sanitizeInput } from '@/lib/highlighter'
import { checkRateLimit, getInputStats, MAX_INPUT_BYTES, validateInput } from '@/lib/rateLimiter'
import { clearShareUrl, copyToClipboard, decodeShareUrl, encodeShareUrl } from '@/lib/sharing'
import { exportAsHtml, exportAsText } from '@/lib/export'
import { saveToHistory } from '@/lib/history'
import { registerShortcuts } from '@/lib/keyboard'
import { OutputErrorBoundary } from '@/components/ErrorBoundary'
import { HistoryPanel } from '@/components/HistoryPanel'
import { ShortcutsModal } from '@/components/ShortcutsModal'

const SAMPLE_LOG = `2024-01-15 10:30:45.123 INFO Starting application server
[2024-01-15] GET /api/users?id=123&active=true HTTP/1.1 200 OK
POST /api/users {"name": "John", "email": "john@example.com"} 201 Created
Error: Connection failed to 192.168.1.100:8080 - null pointer exception
User 550e8400-e29b-41d4-a716-446655440000 logged in from 10.0.0.1/24
WARN: Config file not found at /etc/app/config.yml
DELETE /api/users/456 status=pending 204 No Content
Downloaded file from https://cdn.example.com/repo/release-v2.0.0.tar.gz?token=abc123
localhost:3000 processing request from [::1]:54321
TRACE: Memory at 0x7f8c8c0c0c0c allocated for buffer`

type ProcessingStats = {
  linesProcessed: number
  processingTimeMs: number
}

const EMPTY_STATS: ProcessingStats = {
  linesProcessed: 0,
  processingTimeMs: 0,
}

export default function Home(): JSX.Element {
  const [input, setInput] = useState(SAMPLE_LOG)
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState<ProcessingStats>(EMPTY_STATS)
  const [displayStats, setDisplayStats] = useState<{
    lines: string
    size: string
    processingTime: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopyState, setShareCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [shareError, setShareError] = useState<string | null>(null)
  const [restoredFromUrl, setRestoredFromUrl] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | null>(null)
  const copyResetRef = useRef<number | null>(null)
  const shareResetRef = useRef<number | null>(null)
  const initialLoadHandledRef = useRef(false)
  const skipNextInputProcessingRef = useRef(false)

  const clearTimer = (timerRef: { current: number | null }): void => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const resetShareState = useCallback((): void => {
    setShareUrl(null)
    setShareCopyState('idle')
    setShareError(null)
    clearShareUrl()
    clearTimer(shareResetRef)
  }, [])

  const resetOutputState = useCallback((): void => {
    setOutput('')
    setStats(EMPTY_STATS)
    setDisplayStats(null)
    setIsProcessing(false)
  }, [])

  const processInput = useCallback(
    (rawInput: string, options?: { saveHistory?: boolean }): void => {
      setError(null)
      setErrorDetail(null)

      if (rawInput.trim() === '') {
        resetOutputState()
        return
      }

      const validation = validateInput(rawInput)
      if (!validation.ok) {
        setError(validation.reason)
        setErrorDetail(validation.detail)
        resetOutputState()
        return
      }

      const rateCheck = checkRateLimit()
      if (!rateCheck.allowed) {
        setError(rateCheck.reason)
        setErrorDetail(`Please wait ${Math.ceil(rateCheck.retryAfterMs / 1000)}s before processing again.`)
        resetOutputState()
        return
      }

      setIsProcessing(true)

      try {
        const sanitized = sanitizeInput(rawInput)
        const startedAt = performance.now()
        const highlighted = highlightLog(sanitized)
        const processingTimeMs = Math.round((performance.now() - startedAt) * 100) / 100
        const linesProcessed = sanitized.trim() === '' ? 0 : sanitized.split('\n').length

        setOutput(highlighted)

        if (options?.saveHistory ?? true) {
          saveToHistory(rawInput)
        }

        setStats({ linesProcessed, processingTimeMs })
        setDisplayStats(getInputStats(rawInput, processingTimeMs))
      } catch (caughtError) {
        setError('Processing error')
        setErrorDetail('An unexpected error occurred. Please try different input.')
        resetOutputState()
        console.error('Highlighter error:', caughtError)
      } finally {
        setIsProcessing(false)
      }
    },
    [resetOutputState]
  )

  useEffect(() => {
    skipNextInputProcessingRef.current = true

    if (typeof window === 'undefined') {
      initialLoadHandledRef.current = true
      processInput(SAMPLE_LOG, { saveHistory: false })
      return
    }

    const hash = window.location.hash
    const decoded = decodeShareUrl(hash)

    if (decoded.ok) {
      setInput(decoded.input)
      setRestoredFromUrl(true)
      processInput(decoded.input, { saveHistory: false })
    } else {
      processInput(SAMPLE_LOG, { saveHistory: false })
    }

    initialLoadHandledRef.current = true
  }, [])

  useEffect(() => {
    if (!initialLoadHandledRef.current) {
      return
    }

    if (skipNextInputProcessingRef.current) {
      skipNextInputProcessingRef.current = false
      return
    }

    clearTimer(debounceRef)
    debounceRef.current = window.setTimeout(() => {
      processInput(input)
    }, 300)

    return () => {
      clearTimer(debounceRef)
    }
  }, [input, processInput])

  useEffect(() => {
    return () => {
      clearTimer(debounceRef)
      clearTimer(copyResetRef)
      clearTimer(shareResetRef)
    }
  }, [])

  const handleInputChange = useCallback(
    (value: string): void => {
      resetShareState()
      setInput(value)
    },
    [resetShareState]
  )

  const handleClear = useCallback((): void => {
    clearTimer(debounceRef)
    resetShareState()
    setCopied(false)
    setError(null)
    setErrorDetail(null)
    setExportError(null)
    setRestoredFromUrl(false)
    setInput('')
    resetOutputState()
    inputRef.current?.focus()
  }, [resetOutputState, resetShareState])

  const handleCopyHTML = useCallback(async (): Promise<void> => {
    const html = outputRef.current?.innerHTML ?? output
    if (!html) {
      return
    }

    const didCopy = await copyToClipboard(html)
    if (!didCopy) {
      setError('Copy failed')
      setErrorDetail('Unable to copy highlighted HTML to the clipboard.')
      return
    }

    setCopied(true)
    clearTimer(copyResetRef)
    copyResetRef.current = window.setTimeout(() => {
      setCopied(false)
    }, 2000)
  }, [output])

  const handleShare = useCallback(async (): Promise<void> => {
    resetShareState()

    const result = encodeShareUrl(input, window.location.href)
    if (!result.ok) {
      setShareError(result.reason)
      return
    }

    window.history.replaceState(null, '', result.url)
    setShareUrl(result.url)

    const didCopy = await copyToClipboard(result.url)
    setShareCopyState(didCopy ? 'copied' : 'error')
    clearTimer(shareResetRef)
    shareResetRef.current = window.setTimeout(() => {
      setShareCopyState('idle')
    }, 3000)
  }, [input, resetShareState])

  const handleExportHtml = useCallback((): void => {
    setExportError(null)
    const outputElement = outputRef.current
    const highlightedHtml = outputElement?.innerHTML ?? ''

    if (!highlightedHtml) {
      setExportError('Output panel not found. Please process some logs first.')
      return
    }

    const result = exportAsHtml(highlightedHtml, input)
    if (!result.ok) {
      setExportError(result.reason)
    }
  }, [input])

  const handleExportText = useCallback((): void => {
    setExportError(null)
    const result = exportAsText(input)
    if (!result.ok) {
      setExportError(result.reason)
    }
  }, [input])

  const handleRestoreFromHistory = useCallback(
    (restoredInput: string): void => {
      skipNextInputProcessingRef.current = true
      resetShareState()
      setRestoredFromUrl(false)
      setInput(restoredInput)
      processInput(restoredInput, { saveHistory: false })
    },
    [processInput, resetShareState]
  )

  useEffect(() => {
    return registerShortcuts({
      'focus-input': () => inputRef.current?.focus(),
      'clear-all': handleClear,
      'copy-output-html': () => {
        void handleCopyHTML()
      },
      'export-html': handleExportHtml,
      'export-text': handleExportText,
      share: () => {
        if (input.trim() !== '') {
          void handleShare()
        }
      },
      'toggle-shortcuts': () => setShowShortcuts(current => !current),
      dismiss: () => {
        setShowShortcuts(false)
        setError(null)
        setErrorDetail(null)
        setShareError(null)
        setExportError(null)
        setRestoredFromUrl(false)
      },
    })
  }, [handleClear, handleCopyHTML, handleExportHtml, handleExportText, handleShare, input])

  const byteSize = new Blob([input]).size
  const bytePercent = (byteSize / MAX_INPUT_BYTES) * 100
  const byteWarningClass =
    bytePercent > 95 ? 'text-red-400' : bytePercent > 80 ? 'text-yellow-400' : 'text-gray-500'

  return (
    <main className="min-h-screen bg-gray-900 p-4 text-gray-100 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-cyan-400">Log Highlighter</h1>
          <p className="text-gray-400">A browser-based log file highlighter</p>
        </header>

        <div
          role="note"
          style={{
            padding: '10px 12px',
            marginBottom: '12px',
            background: '#0d1a0d',
            border: '1px solid #1a3a1a',
            borderRadius: '6px',
            color: '#7fd07f',
            fontSize: '12px',
            lineHeight: 1.5,
            fontFamily: 'monospace',
          }}
        >
          Note: logs are stored locally in your browser only. History entries are never sent to any server.
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-600 bg-red-900/30 p-4">
            <p className="font-bold text-red-400">{error}</p>
            {errorDetail && <p className="mt-1 text-sm text-red-300/80">{errorDetail}</p>}
          </div>
        )}

        {restoredFromUrl && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '8px 12px',
              background: '#1a2a1a',
              border: '1px solid #2a4a2a',
              borderRadius: '6px',
              color: '#6fcf6f',
              fontSize: '12px',
              marginBottom: '8px',
            }}
          >
            Log restored from shared URL
            <button
              onClick={() => setRestoredFromUrl(false)}
              style={{
                marginLeft: '12px',
                background: 'none',
                border: 'none',
                color: '#6fcf6f',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="input" className="text-sm font-medium text-gray-300">
                Input Log
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="rounded bg-gray-700 px-3 py-1 text-xs transition-colors hover:bg-gray-600"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleInputChange(SAMPLE_LOG)}
                  className="rounded bg-gray-700 px-3 py-1 text-xs transition-colors hover:bg-gray-600"
                >
                  Sample
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  aria-label="Show keyboard shortcuts"
                  title="Keyboard shortcuts (Shift+?)"
                  style={{
                    background: 'none',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#555',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '4px 8px',
                  }}
                >
                  ?
                </button>
              </div>
            </div>

            <textarea
              id="input"
              ref={inputRef}
              value={input}
              onChange={event => handleInputChange(event.target.value)}
              aria-label="Log input textarea"
              className="h-80 w-full resize-none rounded-lg border border-gray-700 bg-gray-800 p-4 font-mono text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
              placeholder="Paste your log content here..."
              spellCheck={false}
            />

            <div className="mt-2 flex items-center justify-between text-xs">
              <span>{stats.linesProcessed.toLocaleString()} lines</span>
              <span className={byteWarningClass}>
                {byteSize < 1024
                  ? `${byteSize} B`
                  : byteSize < 1024 * 1024
                    ? `${(byteSize / 1024).toFixed(1)} KB`
                    : `${(byteSize / (1024 * 1024)).toFixed(2)} MB`}{' '}
                / {MAX_INPUT_BYTES / 1024} KB
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Highlighted Output</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {isProcessing ? 'Processing...' : `${stats.processingTimeMs.toFixed(2)}ms`}
                </span>
                <button
                  onClick={() => {
                    void handleCopyHTML()
                  }}
                  className={`rounded px-3 py-1 text-xs text-white transition-colors ${
                    copied ? 'bg-green-600' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy HTML'}
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  aria-label="Open log history"
                  title="Recent logs"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1e1e1e',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  History
                </button>
                <button
                  onClick={() => {
                    void handleShare()
                  }}
                  disabled={input.trim() === ''}
                  aria-label="Generate shareable URL for this log output"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1e1e1e',
                    color: '#e0e0e0',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    opacity: input.trim() ? 1 : 0.5,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  {shareCopyState === 'copied'
                    ? 'URL Copied'
                    : shareCopyState === 'error'
                      ? 'Copy Failed'
                      : 'Share'}
                </button>
                <button
                  onClick={handleExportHtml}
                  disabled={output.trim() === ''}
                  aria-label="Export highlighted output as HTML file"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1e1e1e',
                    color: '#e0e0e0',
                    cursor: output.trim() ? 'pointer' : 'not-allowed',
                    opacity: output.trim() ? 1 : 0.5,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  HTML
                </button>
                <button
                  onClick={handleExportText}
                  disabled={input.trim() === ''}
                  aria-label="Export raw log as plain text file"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1e1e1e',
                    color: '#e0e0e0',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    opacity: input.trim() ? 1 : 0.5,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                >
                  TXT
                </button>
              </div>
            </div>

            <OutputErrorBoundary>
              <div
                ref={outputRef}
                role="region"
                aria-label="Highlighted log output"
                className="h-80 w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-700 bg-gray-950 p-4 font-mono text-sm text-gray-100"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </OutputErrorBoundary>
          </div>
        </div>

        {displayStats && (
          <div className="mt-2 text-xs text-gray-500" role="status" aria-live="polite">
            {displayStats.lines} lines · {displayStats.size} · processed in {displayStats.processingTime}
          </div>
        )}

        {shareUrl && (
          <div
            role="region"
            aria-label="Shareable URL"
            style={{
              marginTop: '8px',
              padding: '10px 12px',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              readOnly
              value={shareUrl}
              onClick={event => event.currentTarget.select()}
              aria-label="Shareable URL"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#8fbcff',
                fontFamily: 'monospace',
                fontSize: '12px',
                outline: 'none',
                cursor: 'text',
              }}
            />
            <button
              onClick={() => {
                void copyToClipboard(shareUrl).then(didCopy => {
                  setShareCopyState(didCopy ? 'copied' : 'error')
                })
              }}
              style={{
                fontSize: '11px',
                color: '#aaa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Copy
            </button>
          </div>
        )}

        {shareError && (
          <p role="alert" style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '6px' }}>
            {shareError}
          </p>
        )}

        {exportError && (
          <p role="alert" style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '6px' }}>
            {exportError}
          </p>
        )}

        <section className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-200">Highlight Groups</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="text-pink-400">Dates</span>
              <span className="text-gray-500">2024-01-15, 15:04:05, ISO8601</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">Keywords</span>
              <span className="text-gray-500">null, true, false, GET, POST</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">URLs</span>
              <span className="text-gray-500">https://example.com/path</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">Numbers</span>
              <span className="text-gray-500">42, 3.14, 1000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">IPv4</span>
              <span className="text-gray-500">192.168.1.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">Quotes</span>
              <span className="text-gray-500">&quot;quoted text&quot;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">Paths</span>
              <span className="text-gray-500">/usr/local/bin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">UUIDs</span>
              <span className="text-gray-500">550e8400-e29b-41d4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Key-Value</span>
              <span className="text-gray-500">key=value</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">Status 2xx</span>
              <span className="text-gray-500">200 OK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">Status 3xx</span>
              <span className="text-gray-500">301 Redirect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">Status 4xx/5xx</span>
              <span className="text-gray-500">404 Not Found</span>
            </div>
          </div>
        </section>

        <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
        <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} onRestore={handleRestoreFromHistory} />
      </div>
    </main>
  )
}
