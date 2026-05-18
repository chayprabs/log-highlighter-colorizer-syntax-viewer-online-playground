export type TokenType =
  | 'plain'
  | 'string'
  | 'timestamp'
  | 'uuid'
  | 'ip'
  | 'method'
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'boolean'
  | 'url'
  | 'path'
  | 'number'
  | 'status-2xx'
  | 'status-3xx'
  | 'status-4xx'
  | 'status-5xx'

export interface Token {
  type: TokenType
  text: string
}

const patterns: Array<{ type: TokenType | 'status'; re: RegExp }> = [
  { type: 'string', re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  {
    type: 'timestamp',
    re: /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/,
  },
  { type: 'uuid', re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i },
  { type: 'ip', re: /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/ },
  { type: 'method', re: /\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\b/ },
  { type: 'fatal', re: /\b(?:FATAL|CRITICAL|EMERG|EMERGENCY)\b/ },
  { type: 'error', re: /\bERROR?\b/ },
  { type: 'warn', re: /\b(?:WARN(?:ING)?|ALERT)\b/ },
  { type: 'info', re: /\bINFO(?:RMATION)?\b/ },
  { type: 'debug', re: /\b(?:DEBUG|TRACE|VERBOSE)\b/ },
  { type: 'boolean', re: /\b(?:true|false|TRUE|FALSE|True|False|null|None|nil)\b/ },
  { type: 'status', re: /\b[1-5]\d{2}\b/ },
  { type: 'url', re: /\bhttps?:\/\/[^\s"'<>]+/ },
  { type: 'path', re: /(?:\/[A-Za-z0-9_.\-]+){1,}\/?/ },
  { type: 'number', re: /\b\d+(?:\.\d+)?\b/ },
]

const combined = new RegExp(patterns.map(p => '(' + p.re.source + ')').join('|'), 'g')

function classifyStatus(num: number): TokenType {
  if (num >= 200 && num < 300) return 'status-2xx'
  if (num >= 300 && num < 400) return 'status-3xx'
  if (num >= 400 && num < 500) return 'status-4xx'
  if (num >= 500 && num < 600) return 'status-5xx'
  return 'number'
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let lastIndex = 0
  combined.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = combined.exec(line)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'plain', text: line.slice(lastIndex, m.index) })
    }
    let typeIdx = -1
    for (let i = 1; i < m.length; i++) {
      if (m[i] !== undefined) {
        typeIdx = i - 1
        break
      }
    }
    const rawType = typeIdx >= 0 ? patterns[typeIdx]?.type : 'plain'
    const text = m[0]
    const type: TokenType =
      rawType === 'status' ? classifyStatus(parseInt(text, 10)) : (rawType as TokenType)
    tokens.push({ type, text })
    lastIndex = m.index + m[0].length
    if (m[0].length === 0) combined.lastIndex++
  }
  if (lastIndex < line.length) {
    tokens.push({ type: 'plain', text: line.slice(lastIndex) })
  }
  return tokens
}

export function tokenize(text: string): Token[][] {
  if (!text) return []
  return text.split('\n').map(tokenizeLine)
}

export const SYNC_LINE_THRESHOLD = 5_000
export const CHUNK_LINE_SIZE = 500

export async function tokenizeAsync(
  text: string,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal
): Promise<Token[][]> {
  const lines = text.split('\n')
  if (lines.length <= SYNC_LINE_THRESHOLD) {
    return tokenize(text)
  }

  const result: Token[][] = []
  for (let i = 0; i < lines.length; i += CHUNK_LINE_SIZE) {
    if (signal?.aborted) break
    const batch = lines.slice(i, i + CHUNK_LINE_SIZE)
    for (const line of batch) {
      result.push(tokenizeLine(line))
    }
    onProgress?.(Math.min(i + CHUNK_LINE_SIZE, lines.length), lines.length)
    await new Promise<void>(resolve => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => resolve(), { timeout: 50 })
      } else {
        setTimeout(resolve, 0)
      }
    })
  }
  return result
}
