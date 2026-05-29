import type { TokenId } from '@/lib/urlState'

/** Maps highlighter TokenId values to Glow redesign CSS classes (gs-t-*). */
export function tokenIdToGlowClass(token: TokenId): string {
  const map: Record<TokenId, string> = {
    timestamp: 'gs-t-timestamp',
    'level-error': 'gs-t-error',
    'level-warn': 'gs-t-warn',
    'level-info': 'gs-t-info',
    'level-debug': 'gs-t-debug',
    'status-2xx': 'gs-t-status-2xx',
    'status-3xx': 'gs-t-status-3xx',
    'status-4xx': 'gs-t-status-4xx',
    'status-5xx': 'gs-t-status-5xx',
    'http-method': 'gs-t-method',
    url: 'gs-t-url',
    ip: 'gs-t-ip',
    uuid: 'gs-t-uuid',
    path: 'gs-t-path',
    key: 'gs-t-key',
    value: 'gs-t-value',
    'json-key': 'gs-t-json-key',
    string: 'gs-t-string',
    number: 'gs-t-number',
    literal: 'gs-t-literal',
  }
  return map[token]
}

export const TOKEN_FILTER_LABELS: Record<TokenId, string> = {
  timestamp: 'Timestamp',
  'level-error': 'Error',
  'level-warn': 'Warn',
  'level-info': 'Info',
  'level-debug': 'Debug',
  'status-2xx': '2xx',
  'status-3xx': '3xx',
  'status-4xx': '4xx',
  'status-5xx': '5xx',
  'http-method': 'HTTP method',
  url: 'URL',
  ip: 'IP',
  uuid: 'UUID',
  path: 'Path',
  key: 'Key',
  value: 'Value',
  'json-key': 'JSON key',
  string: 'String',
  number: 'Number',
  literal: 'Literal',
}
