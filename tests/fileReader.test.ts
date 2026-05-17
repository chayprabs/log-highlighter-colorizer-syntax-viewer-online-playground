import { describe, expect, it } from 'vitest'
import { readDroppedTextFile } from '@/lib/fileReader'

describe('readDroppedTextFile', () => {
  it('rejects files over 10 MB without reading', async () => {
    const file = new File(['x'], 'big.log', { type: 'text/plain' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })
    const result = await readDroppedTextFile(file)
    expect(result).toEqual({ ok: false, reason: 'file-too-large' })
  })

  it('rejects binary content with null bytes in the first 1 KB', async () => {
    const buf = new Uint8Array([104, 105, 0, 1, 2])
    const file = new File([buf], 'x.bin', { type: 'application/octet-stream' })
    const result = await readDroppedTextFile(file)
    expect(result).toEqual({ ok: false, reason: 'binary-file' })
  })

  it('normalises CRLF in text files', async () => {
    const file = new File(['a\r\nb'], 'x.log', { type: 'text/plain' })
    const result = await readDroppedTextFile(file)
    expect(result).toEqual({ ok: true, text: 'a\nb' })
  })
})
