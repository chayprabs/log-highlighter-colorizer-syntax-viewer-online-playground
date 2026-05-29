'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/glow/Icons'
import { copyToClipboard } from '@/lib/clipboard'
import type { FontSizeId, ThemeId } from '@/lib/glow-utils'

type ProductToolbarProps = {
  theme: ThemeId
  onThemeToggle: () => void
  lineNumbers: boolean
  onLineNumbersToggle: () => void
  wrap: boolean
  onWrapToggle: () => void
  fontSize: FontSizeId
  onFontSizeChange: (size: FontSizeId) => void
  legendOpen: boolean
  onLegendToggle: () => void
  filtersOpen: boolean
  onFiltersToggle: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  mobile: boolean
  onShare: () => { ok: boolean; message: string }
}

export function ProductToolbar({
  theme,
  onThemeToggle,
  lineNumbers,
  onLineNumbersToggle,
  wrap,
  onWrapToggle,
  fontSize,
  onFontSizeChange,
  legendOpen,
  onLegendToggle,
  filtersOpen,
  onFiltersToggle,
  searchQuery,
  onSearchChange,
  mobile,
  onShare,
}: ProductToolbarProps): JSX.Element {
  const [shareState, setShareState] = useState<'idle' | 'done' | 'error'>('idle')
  const [shareMessage, setShareMessage] = useState('')

  const handleShare = useCallback(async (): Promise<void> => {
    const result = onShare()
    if (!result.ok) {
      setShareState('error')
      setShareMessage(result.message)
      window.setTimeout(() => setShareState('idle'), 3000)
      return
    }
    const url = window.location.href
    const copied = await copyToClipboard(url)
    setShareState(copied ? 'done' : 'error')
    setShareMessage(copied ? 'Link copied' : 'Copy failed — copy the URL from the address bar')
    window.setTimeout(() => setShareState('idle'), 2500)
  }, [onShare])

  return (
    <div className="gs-product-toolbar">
      <div className="gs-search-wrap">
        {Icon.search}
        <input
          type="search"
          className="gs-search-input"
          placeholder={mobile ? 'Search logs…' : 'Search lines…'}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search log lines"
        />
      </div>
      <div className="gs-tools">
        <div className="gs-seg" role="group" aria-label="Font size">
          {(['S', 'M', 'L'] as const).map(s => (
            <button
              key={s}
              type="button"
              className={`gs-seg-btn${fontSize === s ? ' is-active' : ''}`}
              onClick={() => onFontSizeChange(s)}
              aria-pressed={fontSize === s}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="gs-tool-sep" aria-hidden />
        <button
          type="button"
          className={`gs-icon-btn${lineNumbers ? ' is-active' : ''}`}
          title="Line numbers"
          aria-label="Line numbers"
          aria-pressed={lineNumbers}
          onClick={onLineNumbersToggle}
        >
          {Icon.hash}
        </button>
        <button
          type="button"
          className={`gs-icon-btn${wrap ? ' is-active' : ''}`}
          title="Word wrap"
          aria-label="Word wrap"
          aria-pressed={wrap}
          onClick={onWrapToggle}
        >
          {Icon.wrap}
        </button>
        <button
          type="button"
          className="gs-icon-btn"
          title="Theme"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={onThemeToggle}
        >
          {theme === 'dark' ? Icon.sun : Icon.moon}
        </button>
        <span className="gs-tool-sep" aria-hidden />
        <button
          type="button"
          className={`gs-icon-btn${filtersOpen ? ' is-active' : ''}`}
          aria-label="Token filters"
          aria-pressed={filtersOpen}
          aria-expanded={filtersOpen}
          aria-controls="glow-token-filters"
          onClick={onFiltersToggle}
        >
          {Icon.filter}
          {!mobile && <span className="gs-icon-btn-label">Filters</span>}
        </button>
        <button
          type="button"
          className={`gs-icon-btn${legendOpen ? ' is-active' : ''}`}
          aria-label="Legend"
          aria-pressed={legendOpen}
          aria-expanded={legendOpen}
          aria-controls="glow-legend"
          onClick={onLegendToggle}
        >
          {Icon.list}
          {!mobile && <span className="gs-icon-btn-label">Legend</span>}
        </button>
        <button
          type="button"
          className={`gs-icon-btn${shareState === 'done' ? ' is-active' : ''}`}
          aria-label="Share link"
          title="Copy shareable link"
          onClick={() => {
            void handleShare()
          }}
        >
          {Icon.link}
          {!mobile && (
            <span className="gs-icon-btn-label">
              {shareState === 'done' ? 'Copied' : shareState === 'error' ? 'Error' : 'Share'}
            </span>
          )}
        </button>
      </div>
      {shareState === 'error' && shareMessage ? (
        <span className="gs-share-msg" role="status" aria-live="polite">
          {shareMessage}
        </span>
      ) : null}
    </div>
  )
}
