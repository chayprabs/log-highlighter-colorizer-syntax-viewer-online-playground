'use client'

/**
 * Offline fallback page.
 * Shown by the service worker when the user is offline and the
 * requested page is not in the cache.
 *
 * For this tool, this should rarely appear since the entire app
 * is cached on first visit. But it is required as a service worker fallback.
 */

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d0d',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '32px', marginBottom: '16px' }}>📡</p>
      <h1 style={{ fontSize: '18px', marginBottom: '12px', color: '#e0e0e0' }}>
        You are offline
      </h1>
      <p style={{ fontSize: '13px', color: '#888', maxWidth: '360px', lineHeight: 1.6 }}>
        Log Highlighter works offline once it has been loaded at least once.
        If you are seeing this page, try refreshing — the app may not have
        finished caching on your first visit.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '24px',
          padding: '8px 20px',
          background: '#1e1e1e',
          border: '1px solid #444',
          borderRadius: '4px',
          color: '#e0e0e0',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '13px',
        }}
      >
        Retry
      </button>
    </div>
  )
}
