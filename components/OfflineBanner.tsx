'use client'

/**
 * Shows a banner when the user goes offline.
 * Disappears when connectivity is restored.
 * Since the tool works offline, this is informational only — not an error.
 */

import { useEffect, useRef, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const clearOnlineTimeout = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const goOffline = () => {
      clearOnlineTimeout()
      setIsOffline(true)
      setWasOffline(true)
    }

    const goOnline = () => {
      setIsOffline(false)
      clearOnlineTimeout()
      timeoutRef.current = window.setTimeout(() => {
        setWasOffline(false)
        timeoutRef.current = null
      }, 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    // Check initial state
    if (!navigator.onLine) goOffline()

    return () => {
      clearOnlineTimeout()
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline && !wasOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        padding: '10px 16px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 100,
        transition: 'all 0.2s ease',
        background: isOffline ? '#1a0a0a' : '#0a1a0a',
        border: `1px solid ${isOffline ? '#5a1a1a' : '#1a4a1a'}`,
        color: isOffline ? '#ff6b6b' : '#6fcf6f',
      }}
    >
      {isOffline ? '📡 You are offline — the tool still works' : '✓ Back online'}
    </div>
  )
}
