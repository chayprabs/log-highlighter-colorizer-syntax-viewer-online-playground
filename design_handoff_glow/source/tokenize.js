// Glow Redesign — tokenizer (adds boolean detection)
(function () {
  const patterns = [
    { type: 'string', re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
    { type: 'timestamp', re: /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/ },
    { type: 'uuid', re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i },
    { type: 'ip', re: /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/ },
    { type: 'method', re: /\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\b/ },
    { type: 'fatal', re: /\b(?:FATAL|CRITICAL|EMERG|EMERGENCY)\b/ },
    { type: 'error', re: /\bERROR?\b/ },
    { type: 'warn',  re: /\b(?:WARN(?:ING)?|ALERT)\b/ },
    { type: 'info',  re: /\bINFO(?:RMATION)?\b/ },
    { type: 'debug', re: /\b(?:DEBUG|TRACE|VERBOSE)\b/ },
    { type: 'boolean', re: /\b(?:true|false|TRUE|FALSE|True|False|null|None|nil)\b/ },
    { type: 'status', re: /\b[1-5]\d{2}\b/ },
    { type: 'url', re: /\bhttps?:\/\/[^\s"'<>]+/ },
    { type: 'path', re: /(?:\/[A-Za-z0-9_.\-]+){1,}\/?/ },
    { type: 'number', re: /\b\d+(?:\.\d+)?\b/ },
  ];

  const combined = new RegExp(patterns.map(p => '(' + p.re.source + ')').join('|'), 'g');

  function classifyStatus(num) {
    if (num >= 200 && num < 300) return 'status-2xx';
    if (num >= 300 && num < 400) return 'status-3xx';
    if (num >= 400 && num < 500) return 'status-4xx';
    if (num >= 500 && num < 600) return 'status-5xx';
    return 'number';
  }

  function tokenizeLine(line) {
    const tokens = [];
    let lastIndex = 0;
    combined.lastIndex = 0;
    let m;
    while ((m = combined.exec(line)) !== null) {
      if (m.index > lastIndex) tokens.push({ type: 'plain', text: line.slice(lastIndex, m.index) });
      let typeIdx = -1;
      for (let i = 1; i < m.length; i++) if (m[i] !== undefined) { typeIdx = i - 1; break; }
      let type = typeIdx >= 0 ? patterns[typeIdx].type : 'plain';
      let text = m[0];
      if (type === 'status') type = classifyStatus(parseInt(text, 10));
      tokens.push({ type, text });
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) combined.lastIndex++;
    }
    if (lastIndex < line.length) tokens.push({ type: 'plain', text: line.slice(lastIndex) });
    return tokens;
  }

  window.glowTokenize2 = function (text) {
    return text.split('\n').map(tokenizeLine);
  };
})();
