'use client'

import { forwardRef, useCallback, useState } from 'react'
import { Icon } from '@/components/glow/Icons'
import { fmtBytes, fmtInt, MAX_INPUT_BYTES, WARN_INPUT_BYTES } from '@/lib/glow-utils'
import { readDroppedTextFile } from '@/lib/fileReader'

export type InputFootState = 'normal' | 'large-warn' | 'too-large' | 'binary-error'

type InputPanelProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onLoadExample: () => void
  footState: InputFootState
  onFootStateChange: (state: InputFootState) => void
}

export const InputPanel = forwardRef<HTMLTextAreaElement, InputPanelProps>(function InputPanel(
  { value, onChange, onClear, onLoadExample, footState, onFootStateChange },
  ref
): JSX.Element {
  const [dragOver, setDragOver] = useState(false)

  const byteSize = new Blob([value]).size
  const lineCount = value === '' ? 0 : value.split('\n').length

  const updateFootState = useCallback(
    (bytes: number) => {
      if (bytes > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
      } else if (bytes > WARN_INPUT_BYTES) {
        onFootStateChange('large-warn')
      } else {
        onFootStateChange('normal')
      }
    },
    [onFootStateChange]
  )

  const applyText = useCallback(
    (text: string) => {
      const size = new Blob([text]).size
      if (size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        return
      }
      updateFootState(size)
      onChange(text)
    },
    [onChange, onFootStateChange, updateFootState]
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value
      const size = new Blob([next]).size
      if (size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        return
      }
      updateFootState(size)
      onChange(next)
    },
    [onChange, onFootStateChange, updateFootState]
  )

  const handleFile = useCallback(
    async (file: File | undefined): Promise<void> => {
      if (!file) return
      if (file.size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        return
      }
      const result = await readDroppedTextFile(file)
      if (!result.ok) {
        if (result.reason === 'file-too-large') {
          onFootStateChange('too-large')
        } else {
          onFootStateChange('binary-error')
        }
        return
      }
      applyText(result.text)
    },
    [applyText, onFootStateChange]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
      event.preventDefault()
      setDragOver(false)
      await handleFile(event.dataTransfer.files[0])
    },
    [handleFile]
  )

  let footMsg: JSX.Element | null = null
  let stats: JSX.Element | null = null

  if (footState === 'too-large') {
    footMsg = (
      <span id="glow-input-foot-msg" className="gs-foot-msg is-error" role="alert">
        {Icon.ban} Input exceeds the 10&nbsp;MB limit.
      </span>
    )
  } else if (footState === 'binary-error') {
    footMsg = (
      <span id="glow-input-foot-msg" className="gs-foot-msg is-error" role="alert">
        {Icon.ban} Could not read that file — plain text .log or .txt only.
      </span>
    )
  } else if (footState === 'large-warn') {
    footMsg = (
      <span id="glow-input-foot-msg" className="gs-foot-msg is-warn" role="status">
        {Icon.alert} Large input — highlighting may take a moment.
      </span>
    )
  }

  if (!footMsg) {
    stats = (
      <div className="gs-stats">
        <span>
          <strong>{fmtInt(lineCount)}</strong>&nbsp;lines
        </span>
        <span className="gs-stats-dot">·</span>
        <span>{fmtBytes(byteSize)}</span>
      </div>
    )
  } else {
    stats = <div className="gs-stats" />
  }

  return (
    <section className="gs-panel gs-panel-input">
      <div className="gs-panel-head">
        <span className="gs-panel-title">
          <span className="gs-panel-title-dot" />
          Input
        </span>
        <span className="gs-panel-hint">paste · drop · type</span>
      </div>
      <div
        className="gs-input-wrap"
        onDragEnter={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={e => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setDragOver(false)
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          void handleDrop(e)
        }}
      >
        <textarea
          ref={ref}
          id="glow-log-input"
          className="gs-textarea"
          value={value}
          onChange={handleChange}
          placeholder="Paste your log output here, or drop a file…"
          spellCheck={false}
          aria-label="Log input"
          aria-describedby={footMsg ? 'glow-input-foot-msg' : undefined}
        />
        <input
          id="glow-file-input"
          type="file"
          accept=".log,.txt,text/plain"
          className="gs-file-input"
          onChange={e => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {dragOver && (
          <div className="gs-drop" aria-hidden>
            <span className="gs-drop-icon">{Icon.upload}</span>
            <div className="gs-drop-title">Drop your log file here</div>
            <div className="gs-drop-sub">Supports .log · .txt · plain text up to 10 MB</div>
          </div>
        )}
      </div>
      <div className="gs-panel-foot">
        {stats}
        {footMsg}
        <div className="gs-foot-actions">
          <label htmlFor="glow-file-input" className="gs-btn gs-btn-ghost" style={{ cursor: 'pointer' }}>
            Open file
          </label>
          <button type="button" className="gs-btn gs-btn-ghost" onClick={onClear}>
            Clear
          </button>
          <button type="button" className="gs-btn" onClick={onLoadExample}>
            Load Example
          </button>
        </div>
      </div>
    </section>
  )
})
