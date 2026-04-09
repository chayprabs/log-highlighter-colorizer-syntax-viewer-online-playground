import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../app/page'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

const FIRST_LOG = [
  '2026-04-09 10:00:00 INFO incident started',
  '2026-04-09 10:00:01 ERROR retry failed',
].join('\n')

const SECOND_LOG = [
  '2026-04-09 10:05:00 WARN cpu high',
  '2026-04-09 10:05:02 INFO worker recovered',
].join('\n')

async function flushProcessing(ms = 400) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

async function flushEffects() {
  await act(async () => {})
}

async function setTextareaValue(value: string) {
  const textarea = screen.getByLabelText(/log input textarea/i) as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  await flushProcessing()
  return textarea
}

function openHistoryPanel() {
  fireEvent.click(screen.getByRole('button', { name: /open log history/i }))
  return screen.getByRole('complementary', { name: /log history/i })
}

function getRestoreButtons(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll('button')).filter(
    button => button.textContent?.trim() === 'Restore'
  )
}

function getDeleteButtons(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll('button')).filter(button =>
    button.getAttribute('aria-label')?.startsWith('Delete log from')
  )
}

beforeEach(() => {
  localStorageMock.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-04-09T10:00:00.000Z'))

  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Home history flow', () => {
  it('saves, restores, deduplicates, deletes, clears, and persists history entries', async () => {
    const firstRender = render(<Home />)
    await flushProcessing()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await flushProcessing()

    const firstTextarea = await setTextareaValue(FIRST_LOG)
    expect(screen.getByRole('region', { name: /highlighted log output/i }).textContent).toContain('incident started')

    let panel = openHistoryPanel()
    expect(panel.textContent).toContain('Stored locally in your browser only')
    expect(panel.textContent).toContain('incident started')
    expect(panel.textContent).toContain('2 lines')
    expect(panel.textContent).toContain('just now')

    fireEvent.click(screen.getByRole('button', { name: /restore log from/i }))
    await flushEffects()
    expect(screen.queryByRole('complementary', { name: /log history/i })).toBeNull()
    expect(firstTextarea.value).toBe(FIRST_LOG)
    expect(screen.getByRole('region', { name: /highlighted log output/i }).textContent).toContain('incident started')

    const secondTextarea = await setTextareaValue(SECOND_LOG)
    expect(screen.getByRole('region', { name: /highlighted log output/i }).textContent).toContain('cpu high')

    panel = openHistoryPanel()
    expect(getRestoreButtons(panel)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /close history panel/i }))
    expect(screen.queryByRole('complementary', { name: /log history/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await flushProcessing()
    expect(secondTextarea.value).toBe('')

    await setTextareaValue(SECOND_LOG)
    expect(screen.getByRole('region', { name: /highlighted log output/i }).textContent).toContain('cpu high')

    panel = openHistoryPanel()
    expect(getRestoreButtons(panel)).toHaveLength(2)

    fireEvent.click(getDeleteButtons(panel)[0])
    expect(getRestoreButtons(screen.getByRole('complementary', { name: /log history/i }))).toHaveLength(1)

    firstRender.unmount()

    render(<Home />)
    await flushProcessing()

    panel = openHistoryPanel()
    expect(getRestoreButtons(panel)).toHaveLength(1)
    expect(panel.textContent).toContain('Stored locally in your browser only')

    fireEvent.click(screen.getByRole('button', { name: /clear all history/i }))
    expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /click again to confirm/i }))
    expect(screen.getByText('No history yet.')).toBeTruthy()

    cleanup()
    render(<Home />)
    await flushProcessing()

    panel = openHistoryPanel()
    expect(getRestoreButtons(panel)).toHaveLength(0)
    expect(panel.textContent).toContain('No history yet.')
    expect(panel.textContent).toContain('Stored locally in your browser only')
  }, 15000)
})
