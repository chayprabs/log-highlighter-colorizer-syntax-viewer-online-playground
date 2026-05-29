'use client'

import { KNOWN_TOKEN_IDS, type TokenId } from '@/lib/urlState'
import { TOKEN_FILTER_LABELS } from '@/lib/glow-token-classes'

type TokenFiltersProps = {
  open: boolean
  enabled: ReadonlySet<TokenId>
  onToggle: (id: TokenId) => void
  onEnableAll: () => void
  onDisableAll: () => void
}

export function TokenFilters({
  open,
  enabled,
  onToggle,
  onEnableAll,
  onDisableAll,
}: TokenFiltersProps): JSX.Element | null {
  if (!open) {
    return null
  }

  return (
    <div className="gs-token-filters" id="glow-token-filters" role="region" aria-label="Token filters">
      <div className="gs-token-filters-head">
        <span className="gs-token-filters-title">Highlight tokens</span>
        <div className="gs-token-filters-actions">
          <button type="button" className="gs-btn gs-btn-ghost" onClick={onEnableAll}>
            All
          </button>
          <button type="button" className="gs-btn gs-btn-ghost" onClick={onDisableAll}>
            None
          </button>
        </div>
      </div>
      <div className="gs-token-filters-grid">
        {KNOWN_TOKEN_IDS.map(id => (
          <label key={id} className="gs-token-filter-item">
            <input
              type="checkbox"
              checked={enabled.has(id)}
              onChange={() => onToggle(id)}
            />
            <span>{TOKEN_FILTER_LABELS[id]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
