'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { highlightLogWithStats } from '@/lib/highlighter'
import { validateInput, checkRateLimit, getInputStats, MAX_INPUT_BYTES } from '@/lib/rateLimiter'
import { encodeShareUrl, decodeShareUrl, copyToClipboard, clearShareUrl } from '@/lib/sharing'
import { exportAsHtml, exportAsText } from '@/lib/export'
import { saveToHistory } from '@/lib/history'
import { OutputErrorBoundary } from '@/components/ErrorBoundary'
import { HistoryPanel } from '@/components/HistoryPanel'
import { registerShortcuts } from '@/lib/keyboard'
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

export default function Home() {
  const [input, setInput] = useState(SAMPLE_LOG)
  const [output, setOutput] = useState('')
  const [stats, setStats] = useState({ linesProcessed: 0, processingTimeMs: 0 })
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [displayStats, setDisplayStats] = useState<{ lines: string; size: string; processingTime: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const skipInitialHistorySaveRef = useRef(true)
  const skipNextInputProcessingRef = useRef(false)

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopyState, setShareCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [shareError, setShareError] = useState<string | null>(null)
  const [restoredFromUrl, setRestoredFromUrl] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('Service worker registration failed:', error)
      })
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker, { once: true })

    return () => {
      window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  const processInput = useCallback((raw: string, options?: { saveHistory?: boolean }) => {
    setError(null)
    setErrorDetail(null)

    if (raw.trim() === '') {
      setOutput('')
      setDisplayStats(null)
      return
    }

    const validation = validateInput(raw)
    if (!validation.ok) {
      setError(validation.reason)
      setErrorDetail(validation.detail)
      setOutput('')
      return
    }

    const rateCheck = checkRateLimit()
    if (!rateCheck.allowed) {
      setError(rateCheck.reason)
      setErrorDetail(`Please wait ${Math.ceil(rateCheck.retryAfterMs / 1000)}s before processing again.`)
      return
    }

    setIsProcessing(true)

    try {
      const result = highlightLogWithStats(raw)
      setOutput(result.html)
      setStats(result.stats)
      setDisplayStats(getInputStats(raw, result.stats.processingTimeMs))

      // Auto-save to history (fire and forget - do not block on result)
      if (options?.saveHistory ?? true) {
        if (skipInitialHistorySaveRef.current) {
          skipInitialHistorySaveRef.current = false
        } else {
          saveToHistory(raw)
        }
      }
    } catch (err) {
      setError('Processing error')
      setErrorDetail('An unexpected error occurred. Please try with different input.')
      console.error('Highlighter error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    if (!hash || hash === '#') return

    const result = decodeShareUrl(hash)
    if (result.ok) {
      if (result.input !== SAMPLE_LOG) {
        skipNextInputProcessingRef.current = true
        setInput(result.input)
      }
      processInput(result.input, { saveHistory: false })
      setRestoredFromUrl(true)
    }
    // If decoding fails, silently ignore - do not show error on load
    // The URL might just have an unrelated hash
  }, [processInput])

  useEffect(() => {
    if (skipNextInputProcessingRef.current) {
      skipNextInputProcessingRef.current = false
      return
    }

    if (input.trim() === '') {
      processInput('', { saveHistory: false })
      return
    }

    const timeoutId = window.setTimeout(() => {
      processInput(input)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [input, processInput])

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClear = () => {
    setInput('')
    setShareUrl(null)
    setShareCopyState('idle')
    clearShareUrl()
  }

  const handleShare = useCallback(async () => {
    setShareError(null)
    setShareUrl(null)

    const result = encodeShareUrl(input, window.location.href)

    if (!result.ok) {
      setShareError(result.reason)
      return
    }

    // Update the browser URL without reload so the share URL is also the current URL
    window.history.replaceState(null, '', result.url)

    setShareUrl(result.url)

    // Auto-copy to clipboard
    const copied = await copyToClipboard(result.url)
    setShareCopyState(copied ? 'copied' : 'error')

    // Reset copy state after 3 seconds
    setTimeout(() => setShareCopyState('idle'), 3000)
  }, [input])

  const handleExportHtml = useCallback(() => {
    setExportError(null)
    const outputEl = outputRef.current
    if (!outputEl) {
      setExportError('Output panel not found. Please process some logs first.')
      return
    }
    const result = exportAsHtml(outputEl.innerHTML, input)
    if (!result.ok) setExportError(result.reason)
  }, [input])

  const handleExportText = useCallback(() => {
    setExportError(null)
    const result = exportAsText(input)
    if (!result.ok) setExportError(result.reason)
  }, [input])

  const handleRestoreFromHistory = useCallback((restoredInput: string) => {
    if (restoredInput !== input) {
      skipNextInputProcessingRef.current = true
      setInput(restoredInput)
    }
    processInput(restoredInput, { saveHistory: false })
    setShareUrl(null)
    setShareCopyState('idle')
    setShareError(null)
    clearShareUrl()
  }, [input, processInput])

  useEffect(() => {
    return registerShortcuts({
      'focus-input': () => inputRef.current?.focus(),

      'clear-all': () => {
        setInput('')
        setOutput('')
        setStats({ linesProcessed: 0, processingTimeMs: 0 })
        setDisplayStats(null)
        setError(null)
        setShareUrl(null)
        clearShareUrl()
        inputRef.current?.focus()
      },

      'copy-output-html': () => {
        const html = outputRef.current?.innerHTML
        if (html) copyToClipboard(html)
      },

      'export-html': () => {
        const html = outputRef.current?.innerHTML
        if (html) {
          const result = exportAsHtml(html, input)
          if (!result.ok) setExportError(result.reason)
        }
      },

      'export-text': () => {
        const result = exportAsText(input)
        if (!result.ok) setExportError(result.reason)
      },

      'share': () => {
        if (input) handleShare()
      },

      'toggle-shortcuts': () => setShowShortcuts(prev => !prev),

      'dismiss': () => {
        setShowShortcuts(false)
        setError(null)
        setShareError(null)
        setExportError(null)
      },
    })
  }, [input, handleShare])

  const handleInputChange = useCallback((value: string) => {
    setShareUrl(null)
    setShareCopyState('idle')
    clearShareUrl()
    setInput(value)
  }, [])

  const byteSize = new Blob([input]).size
  const bytePercent = (byteSize / MAX_INPUT_BYTES) * 100
  const byteWarningClass = bytePercent > 95 ? 'text-red-400' : bytePercent > 80 ? 'text-yellow-400' : 'text-gray-500'

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Log Highlighter</h1>
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
          <div className="mb-4 p-4 bg-red-900/30 border border-red-600 rounded-lg">
            <p className="font-bold text-red-400">{error}</p>
            {errorDetail && <p className="text-sm text-red-300/80 mt-1">{errorDetail}</p>}
          </div>
        )}

        {restoredFromUrl && (
          <div
            role="status"
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
              style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#6fcf6f', cursor: 'pointer', fontSize: '11px' }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="input" className="text-sm font-medium text-gray-300">
                Input Log
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setInput(SAMPLE_LOG)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
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
              onChange={e => handleInputChange(e.target.value)}
              className="w-full h-80 bg-gray-800 text-gray-100 p-4 rounded-lg border border-gray-700 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
              placeholder="Paste your log content here..."
              spellCheck={false}
              aria-label="Log input textarea - paste your log content here"
            />
            <div className="flex justify-between items-center mt-2 text-xs">
              <span>{stats.linesProcessed.toLocaleString()} lines</span>
              <span className={byteWarningClass}>
                {byteSize < 1024
                  ? `${byteSize} B`
                  : byteSize < 1024 * 1024
                    ? `${(byteSize / 1024).toFixed(1)} KB`
                    : `${(byteSize / (1024 * 1024)).toFixed(2)} MB`} / {MAX_INPUT_BYTES / 1024} KB
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">
                Highlighted Output
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{isProcessing ? 'Processing...' : `${stats.processingTimeMs.toFixed(2)}ms`}</span>
                <button
                  onClick={handleCopyHTML}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
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
                  onClick={handleShare}
                  disabled={!input || input.trim() === ''}
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
                  {shareCopyState === 'copied' ? 'URL Copied' : shareCopyState === 'error' ? 'Copy Failed' : 'Share'}
                </button>
                <button
                  onClick={handleExportHtml}
                  disabled={!output || output.trim() === ''}
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
                  disabled={!input || input.trim() === ''}
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
                className="w-full h-80 bg-gray-950 text-gray-100 p-4 rounded-lg border border-gray-700 font-mono text-sm overflow-auto whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </OutputErrorBoundary>
          </div>
        </div>

        {displayStats && (
          <div className="text-xs text-gray-500 mt-2">
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
              onClick={e => (e.target as HTMLInputElement).select()}
              aria-label="Shareable URL - click to select all"
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
              onClick={() => copyToClipboard(shareUrl).then(ok => setShareCopyState(ok ? 'copied' : 'error'))}
              style={{ fontSize: '11px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}
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

        <section className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Highlight Groups</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
        <HistoryPanel
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestoreFromHistory}
        />
      </div>
    </main>
  )
}
