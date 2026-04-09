import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportAsHtml, exportAsText } from '../lib/export'

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  const mockAnchor = {
    click: vi.fn(),
    style: {},
    setAttribute: vi.fn(),
    href: '',
    download: '',
  }
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement
    return document.createElement(tag)
  })
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body)
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body)
})

describe('exportAsHtml', () => {
  it('returns error for empty highlighted HTML', () => {
    const result = exportAsHtml('', 'raw input')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('empty')
  })

  it('returns error for whitespace-only HTML', () => {
    const result = exportAsHtml('   ', 'raw input')
    expect(result.ok).toBe(false)
  })

  it('returns ok and triggers download for valid input', () => {
    const result = exportAsHtml('<span style="color:cyan">42</span>', 'raw log line')
    expect(result.ok).toBe(true)
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})

describe('exportAsText', () => {
  it('returns error for empty raw input', () => {
    const result = exportAsText('')
    expect(result.ok).toBe(false)
  })

  it('returns error for whitespace-only input', () => {
    const result = exportAsText('   ')
    expect(result.ok).toBe(false)
  })

  it('returns ok and triggers download for valid input', () => {
    const result = exportAsText('2024-01-15 ERROR something failed')
    expect(result.ok).toBe(true)
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})