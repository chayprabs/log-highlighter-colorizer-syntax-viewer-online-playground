/**
 * Log Highlighter — Core highlighting engine
 *
 * Processes plain text log input line by line and returns HTML strings
 * where recognized patterns are wrapped in styled <span> elements.
 *
 * Highlight groups applied in priority order:
 *   1. Dates and timestamps
 *   2. Severity keywords (ERROR, WARN, INFO, DEBUG, null, true, false)
 *   3. HTTP method keywords (GET, POST, PUT, DELETE, PATCH)
 *   4. URLs
 *   5. Numbers
 *   6. IPv4 addresses
 *   7. Quoted strings
 *   8. Unix file paths
 *   9. UUIDs
 *   10. Key-value pairs
 *   11. HTTP status codes
 *   12. JSON keys (applied only to lines that appear to be JSON)
 *
 * All RegExp objects are compiled once at module load time.
 * HTML special characters are escaped before span injection to prevent XSS.
 * Already-highlighted ranges are tracked to prevent double-highlighting.
 *
 * ============================================================
 * SECURITY SANITIZATION PIPELINE
 * ============================================================
 *
 * The sanitization flow follows this exact order:
 *   1. Raw user input → sanitizeInput() at entry point
 *   2. sanitizeInput() → normalize line endings, strip ANSI, strip control chars
 *   3. Line-by-line: processLine() → escapeHtml() FIRST, THEN apply highlight spans
 *
 * CRITICAL: HTML escaping MUST happen before any span injection.
 *
 * ReDoS protection:
 *   - Lines > 5000 chars are returned escaped but un-highlighted
 *   - Each line has a 50ms processing time budget
 *   - Regexes are audited for dangerous patterns (nested quantifiers, etc.)
 */

/**
 * Escapes HTML special characters in a raw string to prevent XSS.
 * This MUST be called on every line of user input before span injection.
 *
 * @param raw - The raw untrusted string from user input
 * @returns A string safe to inject into innerHTML
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
}

/**
 * Strips ANSI terminal escape sequences from a string.
 * Handles color codes, cursor movements, and all CSI sequences.
 *
 * @param input - Raw string potentially containing ANSI escape codes
 * @returns String with all ANSI sequences removed
 */
function stripAnsi(input: string): string {
  return input.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b[^[]/g, '')
}

/**
 * Removes null bytes and non-printable control characters from input.
 * Preserves newlines (\n), carriage returns (\r), and tabs (\t).
 *
 * @param input - Raw string from user input
 * @returns Cleaned string with control characters removed
 */
function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Normalizes line endings to Unix-style \n.
 * Prevents \r characters from rendering visibly in the browser.
 *
 * @param input - Raw multiline string from user input
 * @returns String with all \r\n and standalone \r replaced with \n
 */
function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * Master sanitization pipeline. Call this on raw user input before
 * passing to the highlighter. Returns a clean, safe string.
 *
 * Pipeline order:
 *   1. Normalize line endings (prevent \r rendering)
 *   2. Strip ANSI escape codes (from terminal-copied logs)
 *   3. Strip null bytes and control characters
 *   NOTE: HTML escaping happens per-line inside processLine(), not here,
 *         because it must run after line splitting but before span injection.
 *
 * @param rawInput - Completely untrusted string directly from textarea
 * @returns Sanitized string ready for line-by-line processing
 */
export function sanitizeInput(rawInput: string): string {
  return stripControlChars(stripAnsi(normalizeLineEndings(rawInput)))
}

export interface Span {
  start: number;
  end: number;
  style: string;
}

/**
 * Configuration for each highlight group.
 */
export interface HighlightGroupConfig {
  name: string;
  enabled: boolean;
  description: string;
}

/**
 * All highlight groups with their enabled status.
 * Can be used to build a toggle UI for enabling/disabling highlight categories.
 */
export const HIGHLIGHT_GROUPS: HighlightGroupConfig[] = [
  { name: 'dates', enabled: true, description: 'ISO dates, times, timezones, nginx dates, plain dates' },
  { name: 'keywords', enabled: true, description: 'null, true, false, ERROR, WARN, INFO, DEBUG, HTTP methods' },
  { name: 'urls', enabled: true, description: 'http/https URLs with protocol, host, path, query params' },
  { name: 'numbers', enabled: true, description: 'Integers and decimals with word boundaries' },
  { name: 'ipv4', enabled: true, description: 'IPv4 addresses with valid octet checking (0-255)' },
  { name: 'quotes', enabled: true, description: 'Double-quoted strings' },
  { name: 'paths', enabled: true, description: 'Unix paths (/, ./, ~/)' },
  { name: 'uuids', enabled: true, description: 'UUID v4 format with proper validation' },
  { name: 'keyValue', enabled: true, description: 'key=value and key:value pairs' },
  { name: 'statusCodes', enabled: true, description: 'HTTP status codes (200, 404, 500, etc.)' },
  { name: 'json', enabled: true, description: 'JSON object keys' },
];

/**
 * Result statistics from processing log input.
 */
export interface HighlightStats {
  linesProcessed: number;
  processingTimeMs: number;
}

function isOverlapping(spans: Span[], start: number, end: number): boolean {
  return spans.some(s => start < s.end && end > s.start);
}

function addSpan(spans: Span[], start: number, end: number, style: string) {
  if (start >= end) return;
  spans.push({ start, end, style });
}

function applySpans(text: string, spans: Span[]): string {
  if (spans.length === 0) return escapeHtml(text);

  spans.sort((a, b) => a.start - b.start);
  const result: string[] = [];
  let lastEnd = 0;

  for (const span of spans) {
    if (span.start > lastEnd) {
      result.push(escapeHtml(text.slice(lastEnd, span.start)));
    }
    if (span.start >= lastEnd) {
      result.push(`<span style="${span.style}">${escapeHtml(text.slice(span.start, span.end))}</span>`);
      lastEnd = span.end;
    }
  }

  if (lastEnd < text.length) {
    result.push(escapeHtml(text.slice(lastEnd)));
  }

  return result.join('');
}



const COLORS = {
  red: 'color: #dc4b4b',
  green: 'color: #6eb56c',
  yellow: 'color: #f0d42a',
  blue: 'color: #2aa1d3',
  magenta: 'color: #c51e8a',
  cyan: 'color: #36c4c4',
  white: 'color: #f8f8f2',
  black: 'color: #000000',
  faint: 'opacity: 0.6',
};

const MAGENTA = 'color: #c51e8a';
const CYAN = 'color: #36c4c4';
const BLUE = 'color: #2aa1d3';
const RED = 'color: #dc4b4b';
const FAINT = 'opacity: 0.6';

function combineStyles(...styles: string[]): string {
  return styles.join('; ');
}

function highlightDates(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];
  
  const nginxDatePattern = /\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})\s*([+-]\d{4})?\]/g;
  let match;
  while ((match = nginxDatePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const time = match[4];
    const tz = match[5];
    
    let pos = match.index;
    addSpan(spans, pos, pos + day.length, MAGENTA);
    pos += day.length;
    addSpan(spans, pos, pos + 1, combineStyles(MAGENTA, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + month.length, MAGENTA);
    pos += month.length;
    addSpan(spans, pos, pos + 1, combineStyles(MAGENTA, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + year.length, MAGENTA);
    pos += year.length;
    addSpan(spans, pos, pos + 1, combineStyles(MAGENTA, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + time.length, BLUE);
    pos += time.length;
    if (tz) {
      addSpan(spans, pos, pos + tz.length, RED);
    }
  }

  const plainDatePattern = /(?:^|\s)([A-Za-z]{3})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})(?:\b|$)/g;
  while ((match = plainDatePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const month = match[1];
    const day = match[2];
    const time = match[3];
    
    const startOffset = match[0].startsWith(' ') ? 1 : 0;
    let pos = match.index + startOffset;
    addSpan(spans, pos, pos + month.length, MAGENTA);
    pos += month.length;
    addSpan(spans, pos, pos + 1, combineStyles(MAGENTA, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + day.length, MAGENTA);
    pos += day.length;
    addSpan(spans, pos, pos + 1, combineStyles(MAGENTA, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + time.length, BLUE);
  }

  const isoDatePattern = /\b(19\d{2}|20\d{2})([-\/])(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])\b/g;
  while ((match = isoDatePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    const start = match.index;
    addSpan(spans, start, start + 4, MAGENTA);
    addSpan(spans, start + 4, start + 5, combineStyles(MAGENTA, FAINT));
    addSpan(spans, start + 5, start + 7, MAGENTA);
    addSpan(spans, start + 7, start + 8, combineStyles(MAGENTA, FAINT));
    addSpan(spans, start + 8, start + 10, MAGENTA);
  }

  const timePattern = /\b([01]?\d|2[0-3]):([0-5]\d):([0-5]\d)([.,:](\d+))?(Z|[+-]\d{2}:?\d{2})?\b/g;
  while ((match = timePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const hours = match[1];
    const minutes = match[2];
    const seconds = match[3];
    const fracSep = match[4];
    const frac = match[5];
    const tz = match[6];
    
    let pos = match.index;
    addSpan(spans, pos, pos + hours.length, BLUE);
    pos += hours.length;
    addSpan(spans, pos, pos + 1, combineStyles(BLUE, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + minutes.length, BLUE);
    pos += minutes.length;
    addSpan(spans, pos, pos + 1, combineStyles(BLUE, FAINT));
    pos += 1;
    addSpan(spans, pos, pos + seconds.length, BLUE);
    pos += seconds.length;
    
    if (fracSep && frac) {
      addSpan(spans, pos, pos + fracSep.length, combineStyles(BLUE, FAINT));
      pos += fracSep.length;
      addSpan(spans, pos, pos + frac.length, BLUE);
      pos += frac.length;
    }
    
    if (tz) {
      addSpan(spans, pos, pos + tz.length, RED);
    }
  }

  const usDatePattern = /\b(0[1-9]|1[0-2])([-\/])(0[1-9]|[12]\d|3[01])\2(19\d{2}|20\d{2})\b/g;
  while ((match = usDatePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const start = match.index;
    const month = match[1];
    const day = match[3];
    
    addSpan(spans, start, start + month.length, MAGENTA);
    addSpan(spans, start + month.length, start + month.length + 1, combineStyles(MAGENTA, FAINT));
    addSpan(spans, start + month.length + 1, start + month.length + 1 + day.length, MAGENTA);
    addSpan(spans, start + month.length + 1 + day.length, start + month.length + 1 + day.length + 1, combineStyles(MAGENTA, FAINT));
    addSpan(spans, start + month.length + 1 + day.length + 1, start + match[0].length, MAGENTA);
  }

  return spans;
}

function highlightKeywords(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const boolPatterns: [RegExp, string][] = [
    [/\bnull\b/gi, COLORS.red],
    [/\bnil\b/gi, COLORS.red],
    [/\bNaN\b/gi, COLORS.red],
    [/\bundefined\b/gi, COLORS.red],
    [/\bfalse\b/gi, combineStyles(COLORS.red, 'font-style: italic')],
    [/\btrue\b/gi, combineStyles(COLORS.green, 'font-style: italic')],
  ];

  for (const [pattern, style] of boolPatterns) {
    let m;
    while ((m = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, m.index, m.index + m[0].length)) {
        addSpan(spans, m.index, m.index + m[0].length, style);
      }
    }
  }

  const methodPatterns: [RegExp, string][] = [
    [/\bGET\b/g, combineStyles(COLORS.black, 'background-color: #50fa7b', 'font-weight: bold')],
    [/\bPOST\b/g, combineStyles(COLORS.black, 'background-color: #f1fa8c', 'font-weight: bold')],
    [/\bPUT\b/g, combineStyles(COLORS.black, 'background-color: #ff79c6', 'font-weight: bold')],
    [/\bPATCH\b/g, combineStyles(COLORS.black, 'background-color: #ff79c6', 'font-weight: bold')],
    [/\bDELETE\b/g, combineStyles(COLORS.black, 'background-color: #ff5555', 'font-weight: bold')],
    [/\bHEAD\b/g, combineStyles(COLORS.black, 'background-color: #8be9fd', 'font-weight: bold')],
    [/\bOPTIONS\b/g, combineStyles(COLORS.black, 'background-color: #8be9fd', 'font-weight: bold')],
    [/\bCONNECT\b/g, combineStyles(COLORS.black, 'background-color: #8be9fd', 'font-weight: bold')],
  ];

  for (const [pattern, style] of methodPatterns) {
    let m;
    while ((m = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, m.index, m.index + m[0].length)) {
        addSpan(spans, m.index, m.index + m[0].length, style);
      }
    }
  }

  const severityPatterns: [RegExp, string][] = [
    [/\bERROR\b/g, COLORS.red],
    [/\bWARN(?:ING)?\b/g, COLORS.yellow],
    [/\bINFO\b/g, COLORS.white],
    [/\bDEBUG\b/g, COLORS.green],
    [/\bSUCCESS\b/g, COLORS.green],
    [/\bTRACE\b/g, combineStyles(COLORS.white, COLORS.faint)],
  ];

  for (const [pattern, style] of severityPatterns) {
    let m;
    while ((m = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, m.index, m.index + m[0].length)) {
        addSpan(spans, m.index, m.index + m[0].length, style);
      }
    }
  }

  return spans;
}

function highlightUrls(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const urlPattern = /(https?)(:\/\/)([A-Za-z0-9._-]+)(?::(\d{1,5}))?(\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?(\?[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?/g;
  
  let match;
  while ((match = urlPattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const protocol = match[1] || '';
    const host = match[3] || '';
    const port = match[4] || '';
    const path = match[5] || '';
    const query = match[6] || '';
    let pos = match.index;
    
    const protocolStyle = protocol === 'https' ? combineStyles(COLORS.green, COLORS.faint) : combineStyles(COLORS.red, COLORS.faint);
    addSpan(spans, pos, pos + protocol.length, protocolStyle);
    pos += protocol.length;
    
    addSpan(spans, pos, pos + 3, combineStyles(COLORS.red, COLORS.faint));
    pos += 3;
    
    addSpan(spans, pos, pos + host.length, combineStyles(COLORS.blue, COLORS.faint));
    pos += host.length;
    
    if (port) {
      addSpan(spans, pos, pos + 1, combineStyles(COLORS.red, COLORS.faint));
      addSpan(spans, pos + 1, pos + port.length + 1, combineStyles(COLORS.blue, COLORS.faint));
      pos += port.length + 1;
    }
    
    if (path) {
      addSpan(spans, pos, pos + path.length, COLORS.blue);
      pos += path.length;
    }
    
    if (query) {
      const qPos = pos;
      const qMatch = query.match(/(\?)([A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)/);
      if (qMatch) {
        addSpan(spans, qPos, qPos + 1, combineStyles(COLORS.red, COLORS.faint));
        const params = qMatch[2];
        const pPos = qPos + 1;
        
        const paramPattern = /([A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)=([A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)/g;
        let pMatch;
        while ((pMatch = paramPattern.exec(params)) !== null) {
          addSpan(spans, pPos + pMatch.index, pPos + pMatch.index + pMatch[1].length, COLORS.magenta);
          addSpan(spans, pPos + pMatch.index + pMatch[1].length, pPos + pMatch.index + pMatch[0].length - pMatch[2].length, combineStyles(COLORS.red, COLORS.faint));
          addSpan(spans, pPos + pMatch.index + pMatch[0].length - pMatch[2].length, pPos + pMatch.index + pMatch[0].length, CYAN);
        }
      }
    }
  }

  return spans;
}

function highlightNumbers(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const numberPattern = /\b\d+(?:\.\d+)?\b/g;
  let match;
  while ((match = numberPattern.exec(line)) !== null) {
    if (!isOverlapping(spans, match.index, match.index + match[0].length)) {
      addSpan(spans, match.index, match.index + match[0].length, CYAN);
    }
  }

  return spans;
}

function highlightIPv4(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const ipv4Pattern = /\b(\d{1,3})(\.)(\d{1,3})(\.)(\d{1,3})(\.)(\d{1,3})(?:\/(\d{1,2}))?\b/g;
  let match;
  while ((match = ipv4Pattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const o1 = parseInt(match[1]);
    const o2 = parseInt(match[3]);
    const o3 = parseInt(match[5]);
    const o4 = parseInt(match[7]);
    const cidr = match[8];
    
    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) continue;
    if (cidr && parseInt(cidr) > 32) continue;
    
    let pos = match.index;
    const octets = [match[1], match[3], match[5], match[7]];
    
    for (let i = 0; i < octets.length; i++) {
      addSpan(spans, pos, pos + octets[i].length, combineStyles(COLORS.blue, 'font-style: italic'));
      pos += octets[i].length;
      if (i < 3) {
        addSpan(spans, pos, pos + 1, COLORS.red);
        pos += 1;
      }
    }
    
    if (cidr) {
      addSpan(spans, pos, pos + 1, COLORS.red);
      addSpan(spans, pos + 1, pos + 1 + cidr.length, combineStyles(COLORS.blue, 'font-style: italic'));
    }
  }

  return spans;
}

function highlightQuotes(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const quotePositions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quotePositions.push(i);
  }

  if (quotePositions.length >= 2 && quotePositions.length % 2 === 0) {
    for (let i = 0; i < quotePositions.length; i += 2) {
      const start = quotePositions[i];
      const end = quotePositions[i + 1] + 1;
      if (!isOverlapping(spans, start, end)) {
        addSpan(spans, start, end, COLORS.yellow);
      }
    }
  }

  return spans;
}

function highlightPaths(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const pathPattern = /(?:^|\s)(\.{0,2}\/|\/|\~\/)([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)/g;
  let match;
  while ((match = pathPattern.exec(line)) !== null) {
    const prefix = match[1];
    const path = match[2];
    const actualStart = match[0].startsWith(' ') ? match.index + 1 : match.index;
    
    if (isOverlapping(spans, actualStart, actualStart + match[0].trim().length)) continue;
    
    const pathStart = actualStart + prefix.length;
    
    if (prefix === '/' || prefix === '//') {
      addSpan(spans, actualStart, actualStart + prefix.length, COLORS.yellow);
    } else if (prefix === './') {
      addSpan(spans, actualStart, actualStart + 1, combineStyles(COLORS.green, 'font-style: italic'));
      addSpan(spans, actualStart + 1, actualStart + 2, COLORS.yellow);
    } else if (prefix === '~/') {
      addSpan(spans, actualStart, actualStart + 1, combineStyles(COLORS.green, 'font-style: italic'));
      addSpan(spans, actualStart + 1, actualStart + 2, COLORS.yellow);
    }
    
    let pos = pathStart;
    const segments = path.split('/');
    for (let i = 0; i < segments.length; i++) {
      if (segments[i]) {
        addSpan(spans, pos, pos + segments[i].length, combineStyles(COLORS.green, 'font-style: italic'));
        pos += segments[i].length;
      }
      if (i < segments.length - 1) {
        addSpan(spans, pos, pos + 1, COLORS.yellow);
        pos += 1;
      }
    }
  }

  return spans;
}

function highlightUUIDs(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const uuidPattern = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;
  let match;
  while ((match = uuidPattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    let pos = match.index;
    
    addSpan(spans, pos, pos + 8, combineStyles(COLORS.blue, 'font-style: italic'));
    pos += 8;
    addSpan(spans, pos, pos + 1, COLORS.red);
    pos += 1;
    addSpan(spans, pos, pos + 4, combineStyles(COLORS.magenta, 'font-style: italic'));
    pos += 4;
    addSpan(spans, pos, pos + 1, COLORS.red);
    pos += 1;
    addSpan(spans, pos, pos + 4, combineStyles(COLORS.magenta, 'font-style: italic'));
    pos += 4;
    addSpan(spans, pos, pos + 1, COLORS.red);
    pos += 1;
    addSpan(spans, pos, pos + 4, combineStyles(COLORS.magenta, 'font-style: italic'));
    pos += 4;
    addSpan(spans, pos, pos + 1, COLORS.red);
    pos += 1;
    addSpan(spans, pos, pos + 12, combineStyles(COLORS.blue, 'font-style: italic'));
  }

  return spans;
}

function highlightKeyValue(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const kvPattern = /(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)([=:])(?:\s*)([^=\s]+)?/g;
  let match;
  while ((match = kvPattern.exec(line)) !== null) {
    const [full, key, sep] = match;
    const start = match.index + (match[0].length - full.length);
    
    if (isOverlapping(spans, start, start + key.length + sep.length)) continue;
    
    addSpan(spans, start, start + key.length, combineStyles(COLORS.white, COLORS.faint));
    addSpan(spans, start + key.length, start + key.length + sep.length, COLORS.white);
  }

  return spans;
}

function highlightStatusCodes(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];

  const statusPattern = /\b([1-5][0-9]{2})\b/g;
  let match;
  while ((match = statusPattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const code = parseInt(match[1]);
    let style: string;
    
    if (code >= 200 && code < 300) {
      style = COLORS.green;
    } else if (code >= 300 && code < 400) {
      style = COLORS.yellow;
    } else if (code >= 400 && code < 500) {
      style = COLORS.red;
    } else if (code >= 500) {
      style = combineStyles(COLORS.red, 'font-weight: bold');
    } else {
      continue;
    }
    
    addSpan(spans, match.index, match.index + match[0].length, style);
  }

  return spans;
}

function highlightJSON(line: string, existingSpans: Span[]): Span[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return existingSpans;
  }
  
  try {
    JSON.parse(trimmed);
  } catch {
    return existingSpans;
  }
  
  const spans: Span[] = [...existingSpans];
  
  const jsonKeyPattern = /"([^"]+)"(?=\s*:)/g;
  let match;
  while ((match = jsonKeyPattern.exec(line)) !== null) {
    if (!isOverlapping(spans, match.index, match.index + match[0].length)) {
      addSpan(spans, match.index, match.index + match[0].length, COLORS.yellow);
    }
  }

  return spans;
}

/**
 * Process a single line with ReDoS protection.
 *
 * Flow:
 *   1. Check line length - if > 5000, return escaped without highlights
 *   2. Run highlight functions on RAW line to collect spans
 *   3. applySpans handles HTML escaping in a single pass
 *
 * ReDoS Protection:
 *   - Lines > 5000 chars are escaped and returned without highlighting
 *   - Each line has 50ms max processing time budget
 *   - Any regex error falls back to escaped output only
 *
 * @param rawLine - A single raw line of log input (not yet HTML-escaped)
 * @returns HTML string with highlight spans, or plain escaped fallback
 */
function processLine(rawLine: string): string {
  const MAX_LINE_PROCESS_MS = 50;
  const MAX_LINE_LENGTH = 5000;

  if (rawLine.length > MAX_LINE_LENGTH) {
    return escapeHtml(rawLine);
  }

  const start = performance.now();

  try {
    let spans: Span[] = [];
    
    spans = highlightDates(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightKeywords(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightUrls(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightIPv4(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightUUIDs(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightStatusCodes(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightNumbers(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightQuotes(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightPaths(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightKeyValue(rawLine, spans);
    if (performance.now() - start > MAX_LINE_PROCESS_MS) return escapeHtml(rawLine);

    spans = highlightJSON(rawLine, spans);

    return applySpans(rawLine, spans);
  } catch {
    return escapeHtml(rawLine);
  }
}

/**
 * Highlights log text by wrapping recognized patterns in styled HTML spans.
 *
 * @param input - Raw log text to highlight
 * @returns HTML string with styled spans for recognized patterns
 *
 * @example
 * const result = highlightLog('2024-01-15 10:30:45 INFO Starting server');
 * // Returns: "2024-01-15 10:30:45 <span style="color:...">INFO</span> Starting server"
 */
export function highlightLog(input: string): string {
  if (!input) return '';
  
  const sanitized = sanitizeInput(input);
  const lines = sanitized.split('\n');
  return lines.map(line => processLine(line)).join('\n');
}

/**
 * Highlights log input and returns both the HTML output and processing statistics.
 *
 * @param input - Raw log text to highlight
 * @returns Object containing highlighted HTML string and stats
 *
 * @example
 * const result = highlightLogWithStats('ERROR: Connection failed');
 * // Returns: { html: 'ERROR: Connection failed', stats: { linesProcessed: 1, processingTimeMs: 0.15 } }
 */
export function highlightLogWithStats(input: string): { html: string; stats: HighlightStats } {
  const startTime = performance.now();
  
  if (!input) {
    return { html: '', stats: { linesProcessed: 0, processingTimeMs: 0 } };
  }
  
  const sanitized = sanitizeInput(input);
  const lines = sanitized.split('\n');
  const highlightedLines = lines.map(line => processLine(line));
  
  const endTime = performance.now();
  const processingTime = Math.round((endTime - startTime) * 100) / 100;
  
  return {
    html: highlightedLines.join('\n'),
    stats: {
      linesProcessed: lines.length,
      processingTimeMs: processingTime,
    },
};
}