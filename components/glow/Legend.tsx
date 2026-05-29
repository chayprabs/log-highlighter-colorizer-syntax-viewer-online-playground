import { TOKEN_FILTER_LABELS } from '@/lib/glow-token-classes'
import type { TokenId } from '@/lib/urlState'

type LegendProps = {
  open: boolean
}

const LEGEND: TokenId[] = [
  'timestamp',
  'level-error',
  'level-warn',
  'level-info',
  'level-debug',
  'http-method',
  'status-2xx',
  'status-3xx',
  'status-4xx',
  'status-5xx',
  'url',
  'ip',
  'uuid',
  'path',
  'key',
  'value',
  'json-key',
  'string',
  'number',
  'literal',
]

const LEGEND_CLASS: Record<TokenId, string> = {
  timestamp: 'timestamp',
  'level-error': 'error',
  'level-warn': 'warn',
  'level-info': 'info',
  'level-debug': 'debug',
  'http-method': 'method',
  'status-2xx': 'status-2xx',
  'status-3xx': 'status-3xx',
  'status-4xx': 'status-4xx',
  'status-5xx': 'status-5xx',
  url: 'url',
  ip: 'ip',
  uuid: 'uuid',
  path: 'path',
  key: 'key',
  value: 'value',
  'json-key': 'json-key',
  string: 'string',
  number: 'number',
  literal: 'literal',
}

export function Legend({ open }: LegendProps): JSX.Element {
  return (
    <div id="glow-legend" className={`gs-legend${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="gs-legend-inner">
        {LEGEND.map(type => (
          <div className="gs-legend-item" key={type}>
            <span
              className="gs-dot"
              style={{
                background: `var(--t-${LEGEND_CLASS[type]})`,
                color: `var(--t-${LEGEND_CLASS[type]})`,
              }}
            />
            <span>{TOKEN_FILTER_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
