'use client'

/**
 * History panel showing recent log inputs.
 * Displayed as a slide-in drawer from the left side.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  formatHistoryTime,
  type HistoryEntry,
} from '@/lib/history'

interface Props {
  isOpen: boolean
  onClose: () => void
  onRestore: (input: string) => void
}

export function HistoryPanel({ isOpen, onClose, onRestore }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  // Load entries from localStorage whenever panel opens
  useEffect(() => {
    if (isOpen) {
      setEntries(getHistory())
      setConfirmClearAll(false)
    }
  }, [isOpen])

  const handleRestore = useCallback((entry: HistoryEntry) => {
    onRestore(entry.input)
    onClose()
  }, [onRestore, onClose])

  const handleDelete = useCallback((id: string) => {
    deleteHistoryEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    if (!confirmClearAll) {
      setConfirmClearAll(true)
      return
    }
    clearHistory()
    setEntries([])
    setConfirmClearAll(false)
  }, [confirmClearAll])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        role="complementary"
        aria-label="Log history"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '90vw',
          background: '#111',
          borderRight: '1px solid #2a2a2a',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '2px' }}>
              Recent Logs
            </h2>
            <p style={{ fontSize: '10px', color: '#555' }}>
              {entries.length} of 10 slots used
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history panel"
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </div>

        {/* Privacy notice — always visible */}
        <div style={{
          padding: '10px 20px',
          background: '#0d1a0d',
          borderBottom: '1px solid #1a2a1a',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: '10px', color: '#4a7a4a', lineHeight: 1.5 }}>
            🔒 Stored locally in your browser only.
            Your logs are never sent to any server.
          </p>
        </div>

        {/* Entry list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#444', fontSize: '12px' }}>
              <p>No history yet.</p>
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#333' }}>
                Logs are saved here automatically after processing.
              </p>
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {/* Preview text */}
                <p style={{
                  fontSize: '11px',
                  color: '#aaa',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                }}>
                  {entry.preview}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#555' }}>
                    {formatHistoryTime(entry.timestamp)} · {entry.lineCount.toLocaleString()} lines · {Math.round(entry.byteSize / 1024) || '<1'} KB
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleRestore(entry)}
                      aria-label={`Restore log from ${formatHistoryTime(entry.timestamp)}`}
                      style={{
                        background: '#1a2a1a',
                        border: '1px solid #2a3a2a',
                        borderRadius: '3px',
                        color: '#6fcf6f',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '2px 8px',
                        fontFamily: 'monospace',
                      }}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      aria-label={`Delete log from ${formatHistoryTime(entry.timestamp)}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#555',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 4px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with clear all */}
        {entries.length > 0 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e1e1e',
            flexShrink: 0,
          }}>
            <button
              onClick={handleClearAll}
              style={{
                width: '100%',
                padding: '6px',
                background: confirmClearAll ? '#2a0a0a' : 'none',
                border: `1px solid ${confirmClearAll ? '#5a1a1a' : '#2a2a2a'}`,
                borderRadius: '4px',
                color: confirmClearAll ? '#ff6b6b' : '#555',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                transition: 'all 0.15s ease',
              }}
            >
              {confirmClearAll ? 'Click again to confirm - this cannot be undone' : 'Clear all history'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
