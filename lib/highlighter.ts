export interface Span {
  start: number;
  end: number;
  style: string;
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function combineStyles(...styles: string[]): string {
  return styles.join('; ');
}

function highlightDates(line: string, existingSpans: Span[]): Span[] {
  const spans: Span[] = [...existingSpans];
  
  const isoDatePattern = /\b(19\d{2}|20\d{2})([-\/])(0[1-9]|1[0-2])\2(0[1-9]|[12]\d|3[01])\b/g;
  let match;
  while ((match = isoDatePattern.exec(line)) !== null) {
    const start = match.index;
    addSpan(spans, start, start + 4, COLORS.magenta);
    addSpan(spans, start + 4, start + 5, combineStyles(COLORS.magenta, COLORS.faint));
    addSpan(spans, start + 5, start + 7, COLORS.magenta);
    addSpan(spans, start + 7, start + 8, combineStyles(COLORS.magenta, COLORS.faint));
    addSpan(spans, start + 8, start + 10, COLORS.magenta);
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
    addSpan(spans, pos, pos + hours.length, COLORS.blue);
    pos += hours.length;
    addSpan(spans, pos, pos + 1, combineStyles(COLORS.blue, COLORS.faint));
    pos += 1;
    addSpan(spans, pos, pos + minutes.length, COLORS.blue);
    pos += minutes.length;
    addSpan(spans, pos, pos + 1, combineStyles(COLORS.blue, COLORS.faint));
    pos += 1;
    addSpan(spans, pos, pos + seconds.length, COLORS.blue);
    pos += seconds.length;
    
    if (fracSep && frac) {
      addSpan(spans, pos, pos + fracSep.length, combineStyles(COLORS.blue, COLORS.faint));
      pos += fracSep.length;
      addSpan(spans, pos, pos + frac.length, COLORS.blue);
      pos += frac.length;
    }
    
    if (tz) {
      addSpan(spans, pos, pos + tz.length, COLORS.red);
    }
  }

  const usDatePattern = /\b(0[1-9]|1[0-2])([-\/])(0[1-9]|[12]\d|3[01])\2(19\d{2}|20\d{2})\b/g;
  while ((match = usDatePattern.exec(line)) !== null) {
    if (isOverlapping(spans, match.index, match.index + match[0].length)) continue;
    
    const start = match.index;
    const month = match[1];
    const day = match[3];
    
    addSpan(spans, start, start + month.length, COLORS.magenta);
    addSpan(spans, start + month.length, start + month.length + 1, combineStyles(COLORS.magenta, COLORS.faint));
    addSpan(spans, start + month.length + 1, start + month.length + 1 + day.length, COLORS.magenta);
    addSpan(spans, start + month.length + 1 + day.length, start + month.length + 1 + day.length + 1, combineStyles(COLORS.magenta, COLORS.faint));
    addSpan(spans, start + month.length + 1 + day.length + 1, start + match[0].length, COLORS.magenta);
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
    let match;
    while ((match = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, match.index, match.index + match[0].length)) {
        addSpan(spans, match.index, match.index + match[0].length, style);
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
    let match;
    while ((match = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, match.index, match.index + match[0].length)) {
        addSpan(spans, match.index, match.index + match[0].length, style);
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
    let match;
    while ((match = pattern.exec(line)) !== null) {
      if (!isOverlapping(spans, match.index, match.index + match[0].length)) {
        addSpan(spans, match.index, match.index + match[0].length, style);
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
      addSpan(spans, pos + 1, pos + port.length, combineStyles(COLORS.blue, COLORS.faint));
      pos += port.length;
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
          addSpan(spans, pPos + pMatch.index + pMatch[0].length - pMatch[2].length, pPos + pMatch.index + pMatch[0].length, COLORS.cyan);
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
      addSpan(spans, match.index, match.index + match[0].length, COLORS.cyan);
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

export function highlightLog(input: string): string {
  if (!input) return '';
  
  const lines = input.split('\n');
  const highlightedLines = lines.map(line => {
    let spans: Span[] = [];
    
    spans = highlightDates(line, spans);
    spans = highlightKeywords(line, spans);
    spans = highlightUrls(line, spans);
    spans = highlightNumbers(line, spans);
    spans = highlightIPv4(line, spans);
    spans = highlightQuotes(line, spans);
    spans = highlightPaths(line, spans);
    spans = highlightUUIDs(line, spans);
    spans = highlightKeyValue(line, spans);
    spans = highlightStatusCodes(line, spans);
    spans = highlightJSON(line, spans);
    
    return applySpans(line, spans);
  });
  
  return highlightedLines.join('\n');
}
