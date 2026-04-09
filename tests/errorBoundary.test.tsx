import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) {
    throw new Error('Broken on purpose')
  }

  return <div>Healthy content</div>
}

let suppressWindowError: ((event: ErrorEvent) => void) | null = null

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  suppressWindowError = event => event.preventDefault()
  window.addEventListener('error', suppressWindowError)
})

afterEach(() => {
  if (suppressWindowError) {
    window.removeEventListener('error', suppressWindowError)
  }
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary name="test">
        <div>Normal content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeTruthy()
  })

  it('renders the fallback alert when a child throws', () => {
    render(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/rendering error occurred/i)).toBeTruthy()
  })

  it('resets when Try Again is clicked and the child stops throwing', () => {
    const { rerender } = render(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    rerender(
      <ErrorBoundary name="test">
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /retry rendering/i }))
    expect(screen.getByText('Healthy content')).toBeTruthy()
  })
})
