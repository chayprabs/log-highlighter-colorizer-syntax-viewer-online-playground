import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportAsHtml, exportAsText } from '@/lib/export'

let createdBlob: Blob | null = null

beforeEach(() => {
  createdBlob = null
  vi.useFakeTimers()

  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
    createdBlob = blob
    return 'blob:mock-url'
  })

  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('exportAsHtml', () => {
  it('returns an error for empty highlighted output', () => {
    expect(exportAsHtml('', 'raw input').ok).toBe(false)
  })

  it('generates a full standalone HTML document for valid output', async () => {
    const result = exportAsHtml('<span style="color:#36c4c4">42</span>', 'raw input')
    expect(result.ok).toBe(true)
    expect(createdBlob).not.toBeNull()

    const html = await createdBlob?.text()
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<head>')
    expect(html).toContain('<body>')
    expect(html).toContain('<span style="color:#36c4c4">42</span>')

    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('exportAsText', () => {
  it('returns an error for empty raw input', () => {
    expect(exportAsText('').ok).toBe(false)
  })

  it('downloads the raw text when valid input is provided', async () => {
    const result = exportAsText('2024-01-15 ERROR something failed')
    expect(result.ok).toBe(true)
    expect(createdBlob).not.toBeNull()

    const text = await createdBlob?.text()
    expect(text).toBe('2024-01-15 ERROR something failed')

    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
