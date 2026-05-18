'use client'

import Link from 'next/link'
import { Icon } from '@/components/glow/Icons'
import type { FontSizeId, ThemeId } from '@/lib/glow-utils'

type ToolbarProps = {
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
  mobile: boolean
}

export function Toolbar({
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
  mobile,
}: ToolbarProps): JSX.Element {
  return (
    <header className="gs-toolbar">
      <div className="gs-brand">
        <Link href="/" className="gs-mark" aria-label="Glow home">
          {Icon.glow}
        </Link>
        <Link href="/" className="gs-wordmark" style={{ textDecoration: 'none', color: 'inherit' }}>
          Glow
        </Link>
        {!mobile && <span className="gs-tag">Log syntax highlighting in your browser</span>}
      </div>
      <div className="gs-tools">
        {!mobile && (
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
        )}
        {!mobile && <span className="gs-tool-sep" aria-hidden />}
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
        {!mobile && <span className="gs-tool-sep" aria-hidden />}
        <button
          type="button"
          className={`gs-icon-btn${legendOpen ? ' is-active' : ''}`}
          aria-label="Legend"
          aria-pressed={legendOpen}
          onClick={onLegendToggle}
        >
          {Icon.list}
          {!mobile && <span className="gs-icon-btn-label">Legend</span>}
        </button>
      </div>
    </header>
  )
}
