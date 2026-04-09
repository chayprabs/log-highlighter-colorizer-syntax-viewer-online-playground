'use client'

/**
 * ErrorBoundary — Catches rendering errors in child components.
 *
 * React error boundaries must be class components.
 * This boundary catches errors from:
 *   - dangerouslySetInnerHTML rendering failures
 *   - Highlighter function exceptions that reach the render phase
 *   - Any child component throwing during render, commit, or lifecycle
 *
 * On error: renders a recovery UI that preserves the user's raw input
 * so they do not lose their pasted log content.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode
  /** Optional custom fallback. If not provided, uses default recovery UI. */
  fallback?: ReactNode
  /** Optional callback fired when an error is caught — use for error reporting */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Display name for this boundary — shown in the fallback UI for debugging */
  name?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info })

    // Fire optional callback (useful for logging services later)
    this.props.onError?.(error, info)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorBoundary: ${this.props.name ?? 'unnamed'}]`, error, info)
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default recovery UI
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '20px 24px',
            margin: '8px 0',
            background: '#1a0a0a',
            border: '1px solid #5a1a1a',
            borderRadius: '8px',
            fontFamily: 'monospace',
            color: '#e0e0e0',
          }}
        >
          <p style={{ color: '#ff6b6b', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            ⚠ A rendering error occurred
          </p>
          <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
            The highlighter encountered an unexpected error. Your input has not been lost.
            You can try again or clear the input and start fresh.
          </p>

          {/* Show error message in development only */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ color: '#888', fontSize: '11px', cursor: 'pointer', marginBottom: '8px' }}>
                Error details (development only)
              </summary>
              <pre
                style={{
                  background: '#111',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#ff9999',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={this.handleReset}
              aria-label="Retry rendering"
              style={{
                padding: '6px 16px',
                background: '#2a1a1a',
                border: '1px solid #5a2a2a',
                borderRadius: '4px',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

/**
 * Wraps the log output panel with an error boundary.
 * On error, shows recovery UI without losing the input textarea state.
 */
export function OutputErrorBoundary({ children }: { children: ReactNode }): ReactNode {
  return (
    <ErrorBoundary
      name="OutputPanel"
      onError={(error) => {
        // In production you would send this to an error tracking service
        console.error('Output panel error:', error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Wraps the entire app with a top-level error boundary.
 * Last-resort catch — if this fires, the whole app crashed.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }): ReactNode {
  return (
    <ErrorBoundary
      name="App"
      fallback={
        <div
          role="alert"
          style={{
            padding: '40px',
            textAlign: 'center',
            fontFamily: 'monospace',
            color: '#aaa',
          }}
        >
          <p style={{ color: '#ff6b6b', fontSize: '16px', marginBottom: '12px' }}>
            ⚠ Something went seriously wrong.
          </p>
          <p style={{ fontSize: '13px', marginBottom: '20px' }}>
            Please refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px',
              background: '#1e1e1e',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Refresh Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}