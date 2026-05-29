type LegendProps = {
  open: boolean
}

const LEGEND: Array<[string, string]> = [
  ['timestamp', 'Timestamp'],
  ['error', 'Error'],
  ['warn', 'Warn'],
  ['info', 'Info'],
  ['debug', 'Debug'],
  ['method', 'HTTP method'],
  ['status-2xx', '2xx'],
  ['status-3xx', '3xx'],
  ['status-4xx', '4xx'],
  ['status-5xx', '5xx'],
  ['url', 'URL'],
  ['ip', 'IP'],
  ['uuid', 'UUID'],
  ['path', 'Path'],
  ['string', 'String'],
  ['number', 'Number'],
  ['boolean', 'Bool'],
]

export function Legend({ open }: LegendProps): JSX.Element {
  return (
    <div id="glow-legend" className={`gs-legend${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="gs-legend-inner">
        {LEGEND.map(([type, label]) => (
          <div className="gs-legend-item" key={type}>
            <span
              className="gs-dot"
              style={{
                background: `var(--t-${type})`,
                color: `var(--t-${type})`,
              }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
