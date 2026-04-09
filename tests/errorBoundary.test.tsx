import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary'

function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from BrokenComponent')
  }
  return <div>Working fine</div>
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary name="test">
        <div>Normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Normal content')).toBeTruthy()
  })

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/rendering error occurred/i)).toBeTruthy()
  })

  it('shows Try Again button in fallback UI', () => {
    render(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /retry rendering/i })).toBeTruthy()
  })

  it('recovers when Try Again is clicked and error is gone', () => {
    const { rerender } = render(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeTruthy()

    rerender(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /retry rendering/i }))

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('Working fine')).toBeTruthy()
  })

  it('calls onError callback when child throws', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary name="test" onError={onError}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary name="test" fallback={<div>Custom fallback UI</div>}>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback UI')).toBeTruthy()
  })
})