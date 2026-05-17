'use client'

import { useCallback, useRef } from 'react'
import { MAX_FILE_BYTES, readDroppedTextFile } from '@/lib/fileReader'
import { MAX_TEXT_BYTES } from '@/lib/urlState'

const WARNING_BYTES = 1024 * 1024
const PLACEHOLDER = 'Paste your log output here, or drop a file…'

type LogInputProps = {
  value: string
  onChange: (next: string) => void
  onClear: () => void
  onLoadExample: () => void
  fileError: string | null
  onFileError: (message: string | null) => void
}

export function LogInput({
  value,
  onChange,
  onClear,
  onLoadExample,
  fileError,
  onFileError,
}: LogInputProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const byteSize = new Blob([value]).size
  const showLargeWarning = byteSize >= WARNING_BYTES && byteSize <= MAX_TEXT_BYTES

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLTextAreaElement>): Promise<void> => {
      event.preventDefault()
      onFileError(null)
      const file = event.dataTransfer.files[0]
      if (!file) {
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        onFileError('File is too large. Maximum is 10 MB.')
        return
      }
      const result = await readDroppedTextFile(file)
      if (!result.ok) {
        if (result.reason === 'binary-file') {
          onFileError('This does not appear to be a text file.')
        } else if (result.reason === 'file-too-large') {
          onFileError('File is too large. Maximum is 10 MB.')
        } else {
          onFileError('Could not read that file.')
        }
        return
      }
      onChange(result.text)
    },
    [onChange, onFileError]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLTextAreaElement>): void => {
    event.preventDefault()
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
      onFileError(null)
      const next = event.target.value
      const size = new Blob([next]).size
      if (size > MAX_TEXT_BYTES) {
        onFileError('Input exceeds the 10 MB limit.')
        return
      }
      onChange(next)
    },
    [onChange, onFileError]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="glow-log-input" className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Input
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onLoadExample}
            className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            Load example
          </button>
        </div>
      </div>

      <textarea
        id="glow-log-input"
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onDrop={e => {
          void handleDrop(e)
        }}
        onDragOver={handleDragOver}
        spellCheck={false}
        placeholder={PLACEHOLDER}
        className="min-h-[280px] w-full flex-1 resize-y rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-cyan-500"
        aria-label="Log input"
      />

      {fileError && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
          {fileError}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          {value.length === 0 ? '0' : value.split('\n').length.toLocaleString()} lines ·{' '}
          {byteSize < 1024 ? `${byteSize} B` : byteSize < 1024 * 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${(byteSize / (1024 * 1024)).toFixed(2)} MB`}
        </span>
        {showLargeWarning && (
          <span className="text-amber-600 dark:text-amber-400">Large input — highlighting may take a moment</span>
        )}
      </div>
    </div>
  )
}
