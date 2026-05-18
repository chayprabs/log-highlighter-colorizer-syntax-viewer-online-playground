'use client'

import { useCallback, useState } from 'react'
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

export function InputPanel({
  value,
  onChange,
  onClear,
  onLoadExample,
  footState,
  onFootStateChange,
}: InputPanelProps): JSX.Element {
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

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value
      const size = new Blob([next]).size
      if (size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        onChange('')
        return
      }
      updateFootState(size)
      onChange(next)
    },
    [onChange, onFootStateChange, updateFootState]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
      event.preventDefault()
      setDragOver(false)
      const file = event.dataTransfer.files[0]
      if (!file) return

      if (file.size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        onChange('')
        return
      }

      const result = await readDroppedTextFile(file)
      if (!result.ok) {
        if (result.reason === 'binary-file') {
          onFootStateChange('binary-error')
        } else if (result.reason === 'file-too-large') {
          onFootStateChange('too-large')
          onChange('')
        }
        return
      }

      const size = new Blob([result.text]).size
      if (size > MAX_INPUT_BYTES) {
        onFootStateChange('too-large')
        onChange('')
        return
      }
      updateFootState(size)
      onChange(result.text)
    },
    [onChange, onFootStateChange, updateFootState]
  )

  let footMsg: JSX.Element | null = null
  let stats: JSX.Element | null = null

  if (footState === 'too-large') {
    footMsg = (
      <span className="gs-foot-msg is-error">
        {Icon.ban} Input exceeds the 10&nbsp;MB limit.
      </span>
    )
  } else if (footState === 'binary-error') {
    footMsg = (
      <span className="gs-foot-msg is-error">
        {Icon.ban} This does not appear to be a text file.
      </span>
    )
  } else if (footState === 'large-warn') {
    footMsg = (
      <span className="gs-foot-msg is-warn">
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
          id="glow-log-input"
          className="gs-textarea"
          value={value}
          onChange={handleChange}
          placeholder="Paste your log output here, or drop a file…"
          spellCheck={false}
          aria-label="Log input"
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
}
