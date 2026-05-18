import { describe, expect, it } from 'vitest'
import { tokenize } from '@/lib/tokenize'

describe('tokenize', () => {
  it('returns empty for empty input', () => {
    expect(tokenize('')).toEqual([])
  })

  it('marks ERROR and status in example line', () => {
    const lines = tokenize('2026-05-18T09:23:15.402Z ERROR api.requests status=404')
    const types = lines[0]?.map(t => t.type) ?? []
    expect(types).toContain('timestamp')
    expect(types).toContain('error')
    expect(types).toContain('status-4xx')
  })

  it('classifies HTTP status buckets', () => {
    expect(tokenize('x 502 y')[0]?.some(t => t.type === 'status-5xx')).toBe(true)
    expect(tokenize('x 404 y')[0]?.some(t => t.type === 'status-4xx')).toBe(true)
    expect(tokenize('x 302 y')[0]?.some(t => t.type === 'status-3xx')).toBe(true)
    expect(tokenize('x 200 y')[0]?.some(t => t.type === 'status-2xx')).toBe(true)
  })

  it('marks UUID', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    expect(tokenize(`trace=${id}`)[0]?.some(t => t.type === 'uuid' && t.text === id)).toBe(true)
  })

  it('marks IP, path, and status in nginx-style line', () => {
    const line = '192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234'
    const types = tokenize(line)[0]?.map(t => t.type) ?? []
    expect(types).toContain('ip')
    expect(types).toContain('string')
    expect(types).toContain('path')
    expect(types).toContain('status-2xx')
  })
})
