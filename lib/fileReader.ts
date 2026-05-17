export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const BINARY_SNIFF_BYTES = 1024

export type ReadTextFileResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'file-too-large' | 'binary-file' | 'read-failed' }

export function readDroppedTextFile(file: File): Promise<ReadTextFileResult> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.resolve({ ok: false, reason: 'file-too-large' })
  }

  return new Promise(resolve => {
    const reader = new FileReader()

    reader.onload = (): void => {
      const result = reader.result
      if (typeof result !== 'string') {
        resolve({ ok: false, reason: 'read-failed' })
        return
      }

      const head = result.slice(0, BINARY_SNIFF_BYTES)
      if (head.includes('\x00')) {
        resolve({ ok: false, reason: 'binary-file' })
        return
      }

      resolve({ ok: true, text: result.replace(/\r\n/g, '\n').replace(/\r/g, '\n') })
    }

    reader.onerror = (): void => {
      resolve({ ok: false, reason: 'read-failed' })
    }

    reader.readAsText(file)
  })
}
