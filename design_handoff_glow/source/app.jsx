// Glow Redesign — shell component + secondary pages + design canvas.
// One file because everything is shared (icons, toolbar, footer).

const { useMemo } = React;

// ── Icons (16px line, currentColor) ──────────────────────────────────────
const Icon = {
  sun: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"/></svg>,
  hash: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11M2 10h11M6 2.5 4.5 13.5M11.5 2.5 10 13.5"/></svg>,
  wrap: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h12M2 8h9a2.5 2.5 0 0 1 0 5h-2M2 12h4"/><path d="m11 11-2 2 2 2" strokeWidth="1.4"/></svg>,
  list: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="4" cy="4.5" r="1" fill="currentColor"/><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="4" cy="11.5" r="1" fill="currentColor"/><path d="M7 4.5h7M7 8h7M7 11.5h7"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M10.5 5V3.5A1 1 0 0 0 9.5 2.5h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8.5 3.5 3.5L13 5"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>,
  lock: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>,
  chev:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 4 4 4-4"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8h9M9 4.5 12.5 8 9 11.5"/></svg>,
  upload: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>,
  glow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
  fileText: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>,
  spark: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="3.5"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5 14.5 13H1.5L8 1.5z"/><path d="M8 6.5v3M8 11.4v.1"/></svg>,
  ban: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="m3.8 3.8 8.4 8.4"/></svg>,
};

// ── Token rendering ──────────────────────────────────────────────────────
function GsTokens({ tokens }) {
  return tokens.map((t, i) =>
    t.type === 'plain'
      ? <React.Fragment key={i}>{t.text}</React.Fragment>
      : <span key={i} className={'gs-t-' + t.type}>{t.text}</span>
  );
}

// ── Legend ───────────────────────────────────────────────────────────────
const LEGEND = [
  ['timestamp', 'Timestamp'],
  ['error',     'Error'],
  ['warn',      'Warn'],
  ['info',      'Info'],
  ['debug',     'Debug'],
  ['method',    'HTTP method'],
  ['status-2xx','2xx'],
  ['status-3xx','3xx'],
  ['status-4xx','4xx'],
  ['status-5xx','5xx'],
  ['url',       'URL'],
  ['ip',        'IP'],
  ['uuid',      'UUID'],
  ['path',      'Path'],
  ['string',    'String'],
  ['number',    'Number'],
  ['boolean',   'Bool'],
];

function GsLegend({ open }) {
  return (
    <div className={'gs-legend' + (open ? ' is-open' : '')}>
      <div className="gs-legend-inner">
        {LEGEND.map(([type, label]) => (
          <div className="gs-legend-item" key={type}>
            <span className="gs-dot" style={{ background: `var(--t-${type})`, color: `var(--t-${type})` }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Toolbar ──────────────────────────────────────────────────────────────
function GsToolbar({ ui, mobile }) {
  return (
    <header className="gs-toolbar">
      <div className="gs-brand">
        <span className="gs-mark">{Icon.glow}</span>
        <span className="gs-wordmark">Glow</span>
        {!mobile && <span className="gs-tag">Log syntax highlighting in your browser</span>}
      </div>
      <div className="gs-tools">
        {!mobile && (
          <div className="gs-seg" role="group" aria-label="Font size">
            {['S','M','L'].map(s => (
              <button key={s} type="button" className={'gs-seg-btn' + (ui.fontSize === s ? ' is-active' : '')}>{s}</button>
            ))}
          </div>
        )}
        {!mobile && <span className="gs-tool-sep" />}
        <button type="button" className={'gs-icon-btn' + (ui.lineNumbers ? ' is-active' : '')} title="Line numbers">{Icon.hash}</button>
        <button type="button" className={'gs-icon-btn' + (ui.wrap ? ' is-active' : '')} title="Word wrap">{Icon.wrap}</button>
        <button type="button" className="gs-icon-btn" title="Theme">{ui.theme === 'dark' ? Icon.sun : Icon.moon}</button>
        {!mobile && <span className="gs-tool-sep" />}
        <button type="button" className={'gs-icon-btn' + (ui.legendOpen ? ' is-active' : '')}>
          {Icon.list}
          {!mobile && <span className="gs-icon-btn-label">Legend</span>}
        </button>
      </div>
    </header>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────
function GsFooter({ mobile }) {
  return (
    <footer className="gs-footer">
      <div className="gs-foot-priv">
        <span className="gs-foot-lock">{Icon.lock}</span>
        <span>{mobile ? 'Nothing leaves your browser.' : 'Nothing leaves your browser. Log content is processed locally. No data sent to any server.'}</span>
      </div>
      <div className="gs-foot-meta">
        <span>© 2026 Authos</span>
        <span className="gs-foot-meta-dot">·</span>
        <a className="gs-foot-link" href="#">Privacy</a>
        <a className="gs-foot-link" href="#">Terms</a>
        <a className="gs-foot-link" href="#">Credits</a>
      </div>
    </footer>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
  return (b / (1024 * 1024)).toFixed(2) + ' MB';
}
function fmtInt(n) { return n.toLocaleString(); }

// ── Glow shell (the main two-panel app) ──────────────────────────────────
function GlowShell({
  theme = 'light',
  mode = 'active',           // 'active' | 'empty' | 'drag' | 'processing'
  inputState = 'normal',     // 'normal' | 'large-warn' | 'too-large' | 'binary-error'
  legendOpen = false,
  lineNumbers = true,
  wrap = false,
  fontSize = 'M',
  mobile = false,
  inputOverride = null,
  copyState = 'idle',        // 'idle' | 'done'
  processing = { lines: 12483, progress: 0.62 },
}) {
  const ui = { theme, legendOpen, lineNumbers, wrap, fontSize };
  const inputText = inputOverride !== null
    ? inputOverride
    : (mode === 'empty' ? '' : window.GLOW_EXAMPLE2);

  const lines = useMemo(
    () => (mode === 'active' || mode === 'copy-success' ? window.glowTokenize2(inputText) : []),
    [inputText, mode]
  );

  // Input footer content
  let footMsg = null;
  let stats = null;
  if (inputState === 'too-large') {
    footMsg = (
      <span className="gs-foot-msg is-error">{Icon.ban} Input exceeds the 10&nbsp;MB limit.</span>
    );
  } else if (inputState === 'binary-error') {
    footMsg = (
      <span className="gs-foot-msg is-error">{Icon.ban} This does not appear to be a text file.</span>
    );
  } else if (inputState === 'large-warn') {
    footMsg = (
      <span className="gs-foot-msg is-warn">{Icon.alert} Large input — highlighting may take a moment.</span>
    );
  }
  if (!footMsg) {
    // normal stats
    const lc = inputText === '' ? 0 : inputText.split('\n').length;
    const bc = new Blob([inputText]).size;
    stats = (
      <div className="gs-stats">
        <span><strong>{fmtInt(lc)}</strong>&nbsp;lines</span>
        <span className="gs-stats-dot">·</span>
        <span>{fmtBytes(bc)}</span>
      </div>
    );
  } else {
    stats = <div className="gs-stats" />;
  }

  // Output area content selector
  let outputBody;
  if (mode === 'empty') {
    outputBody = (
      <div className="gs-out-empty">
        <span className="gs-out-empty-glyph">{Icon.spark}</span>
        <div>
          <div className="gs-out-empty-title">Highlighted output will appear here</div>
          <div className="gs-out-empty-sub">
            Try pasting a log on the left, or drag a&nbsp;<span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.log</span> / <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>.txt</span> file onto the input.
          </div>
        </div>
        <span className="gs-arrow">{mobile ? '↑ Add input above' : '← Start in the input panel'}</span>
      </div>
    );
  } else if (mode === 'processing') {
    outputBody = (
      <div className="gs-out-processing">
        <div className="gs-processing-text">Highlighting {fmtInt(processing.lines)} lines…</div>
        <div className="gs-progress">
          <div className="gs-progress-fill" style={{ transform: `scaleX(${processing.progress})` }} />
        </div>
        <div className="gs-processing-sub">{Math.round(processing.progress * 100)}%&nbsp;·&nbsp;{fmtInt(Math.round(processing.lines * processing.progress))} / {fmtInt(processing.lines)} lines</div>
      </div>
    );
  } else {
    // active or copy-success
    outputBody = (
      <pre className="gs-out-pre">
        {lines.map((toks, i) => (
          <div className="gs-out-line" key={i}>
            {lineNumbers && <span className="gs-ln">{i + 1}</span>}
            <span className="gs-ln-content"><GsTokens tokens={toks} /></span>
          </div>
        ))}
      </pre>
    );
  }

  // Output panel head — copy button reflects state
  const outLineCount = (mode === 'active' || mode === 'copy-success') ? lines.length : 0;

  const shellCls = [
    'glow-shell',
    'fs-' + fontSize,
    lineNumbers ? 'has-gutter' : '',
    wrap ? 'is-wrap' : '',
    mobile ? 'is-mobile' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellCls} data-theme={theme}>
      <GsToolbar ui={ui} mobile={mobile} />
      <GsLegend open={legendOpen} />
      <main className="gs-main">
        <section className="gs-panel gs-panel-input">
          <div className="gs-panel-head">
            <span className="gs-panel-title">
              <span className="gs-panel-title-dot" />
              Input
            </span>
            <span className="gs-panel-hint">paste · drop · type</span>
          </div>
          <div className="gs-input-wrap">
            <textarea
              className="gs-textarea"
              readOnly
              value={inputText}
              placeholder="Paste your log output here, or drop a file…"
              spellCheck="false"
            />
            {mode === 'drag' && (
              <div className="gs-drop">
                <span className="gs-drop-icon">{Icon.upload}</span>
                <div className="gs-drop-title">Drop your log file here</div>
                <div className="gs-drop-sub">Supports .log · .txt · plain text up to 10 MB</div>
              </div>
            )}
          </div>
          <div className="gs-panel-foot">
            {stats}
            {footMsg}
            <div className="gs-foot-actions">
              <button type="button" className="gs-btn gs-btn-ghost">Clear</button>
              <button type="button" className="gs-btn">Load Example</button>
            </div>
          </div>
        </section>

        <section className="gs-panel gs-panel-output">
          <div className="gs-panel-head">
            <span className="gs-panel-title">
              <span className="gs-panel-title-dot" style={{ background: 'var(--accent)' }} />
              Output
            </span>
            <div className="gs-out-actions">
              {mode !== 'empty' && mode !== 'processing' && (
                <>
                  <button type="button" className={'gs-btn ' + (copyState === 'done' ? 'gs-btn-success' : '')}>
                    {copyState === 'done' ? Icon.check : Icon.copy}
                    <span>{copyState === 'done' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button type="button" className="gs-btn">
                    {Icon.download}<span>Download</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="gs-out-viewport">{outputBody}</div>
          <div className="gs-panel-foot">
            <div className="gs-stats">
              {mode === 'processing' ? (
                <span>processing…</span>
              ) : (
                <><span><strong>{fmtInt(outLineCount)}</strong>&nbsp;lines</span><span className="gs-stats-dot">·</span><span>UTF-8</span></>
              )}
            </div>
            <div className="gs-stats" style={{ color: 'var(--fg-faint)' }}>plain text</div>
          </div>
        </section>
      </main>
      <GsFooter mobile={mobile} />
    </div>
  );
}

// ── Secondary pages ──────────────────────────────────────────────────────
function PageShell({ theme = 'light', children }) {
  return (
    <div className="glow-shell" data-theme={theme}>
      <GsToolbar ui={{ theme, legendOpen: false, lineNumbers: true, wrap: false, fontSize: 'M' }} mobile={false} />
      <div className="gs-page">
        <div className="gs-page-inner">{children}</div>
      </div>
      <GsFooter mobile={false} />
    </div>
  );
}

function PrivacyPage({ theme = 'light' }) {
  return (
    <PageShell theme={theme}>
      <div className="gs-page-eyebrow">Privacy</div>
      <h1 className="gs-page-title">Your logs stay on your machine.</h1>
      <p className="gs-page-lede">Glow runs entirely in your browser. We don't operate a backend that sees your log content, and we don't want to.</p>

      <section className="gs-page-section">
        <h2>What we collect</h2>
        <p>Nothing. Glow doesn't have an account system, doesn't set cookies, and doesn't include any analytics, telemetry, or tracking scripts.</p>
      </section>

      <section className="gs-page-section">
        <h2>What stays on your device</h2>
        <ul className="gs-page-list">
          <li>The text you paste or drop into the Input panel never leaves the page.</li>
          <li>Highlighting and tokenization happen in JavaScript running locally.</li>
          <li>Glow does not persist anything to <span className="gs-page-kbd">localStorage</span> or IndexedDB.</li>
        </ul>
      </section>

      <section className="gs-page-section">
        <h2>Shareable URLs</h2>
        <p>The "Share" feature compresses your input into the URL fragment (the part after <span className="gs-page-kbd">#</span>) using lz-string. Fragments are not sent to servers by browsers — but anyone you send the link to can see the content.</p>
      </section>

      <section className="gs-page-section">
        <h2>Hosting</h2>
        <p>This site is served as static files. Standard server access logs may record your IP address and the URL path you requested — but never the URL fragment, so log content is not visible to the host.</p>
      </section>
    </PageShell>
  );
}

function TermsPage({ theme = 'light' }) {
  return (
    <PageShell theme={theme}>
      <div className="gs-page-eyebrow">Terms</div>
      <h1 className="gs-page-title">Use it freely. No warranty.</h1>
      <p className="gs-page-lede">Glow is provided by Authos as a free tool, released under the MIT license. Use it for any purpose, including commercial.</p>

      <section className="gs-page-section">
        <h2>License</h2>
        <p>Glow's source is distributed under the MIT license. You may copy, modify, and redistribute it, including in proprietary software, provided the copyright and license notice are preserved.</p>
      </section>

      <section className="gs-page-section">
        <h2>No warranty</h2>
        <p>The software is provided "as is," without warranty of any kind, express or implied. We make no guarantees about correctness of token highlighting, completeness of detection, or fitness for any particular purpose.</p>
      </section>

      <section className="gs-page-section">
        <h2>Acceptable use</h2>
        <ul className="gs-page-list">
          <li>Don't use Glow to process content you aren't permitted to read.</li>
          <li>Don't attempt to abuse hosting resources (scripted bulk requests, etc).</li>
          <li>Don't republish Glow misrepresenting it as your own original work.</li>
        </ul>
      </section>

      <section className="gs-page-section">
        <h2>Changes</h2>
        <p>These terms may be revised. The current version always lives at <span className="gs-page-kbd">/terms</span>.</p>
      </section>
    </PageShell>
  );
}

function CreditsPage({ theme = 'light' }) {
  return (
    <PageShell theme={theme}>
      <div className="gs-page-eyebrow">Credits</div>
      <h1 className="gs-page-title">Built on open source.</h1>
      <p className="gs-page-lede">Glow is a thin layer over good libraries. Many thanks to the maintainers below.</p>

      <section className="gs-page-section" style={{ borderTop: 0, marginTop: 0, paddingTop: 0 }}>
        <div className="gs-page-credit">
          <div className="gs-page-credit-name">Next.js</div>
          <div className="gs-page-credit-body">
            The React framework that powers the site. <a className="gs-page-credit-link" href="https://nextjs.org">nextjs.org</a>
          </div>
        </div>
        <div className="gs-page-credit">
          <div className="gs-page-credit-name">lz-string</div>
          <div className="gs-page-credit-body">
            Compresses log content into shareable URL fragments. <a className="gs-page-credit-link" href="https://github.com/pieroxy/lz-string">github.com/pieroxy/lz-string</a>
          </div>
        </div>
        <div className="gs-page-credit">
          <div className="gs-page-credit-name">next-pwa</div>
          <div className="gs-page-credit-body">
            Service-worker glue so Glow works offline once visited. <a className="gs-page-credit-link" href="https://github.com/shadowwalker/next-pwa">github.com/shadowwalker/next-pwa</a>
          </div>
        </div>
        <div className="gs-page-credit">
          <div className="gs-page-credit-name">Plus Jakarta Sans</div>
          <div className="gs-page-credit-body">
            UI typeface by Tokotype. <a className="gs-page-credit-link" href="https://fonts.google.com/specimen/Plus+Jakarta+Sans">fonts.google.com</a>
          </div>
        </div>
        <div className="gs-page-credit">
          <div className="gs-page-credit-name">JetBrains Mono</div>
          <div className="gs-page-credit-body">
            Monospace face used for log content. <a className="gs-page-credit-link" href="https://www.jetbrains.com/lp/mono/">jetbrains.com/lp/mono</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

// ── Artboard wrapper helpers ─────────────────────────────────────────────
const DESK = { w: 1280, h: 760 };
const PHONE = { w: 390, h: 844 };

// ── Canvas ───────────────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas
      title="Glow — Authos"
      subtitle="Browser-based log syntax highlighter · all states & pages"
    >
      <DCSection id="light-main" title="Main · Light theme" subtitle="Pure white background · Plus Jakarta Sans · indigo accent">
        <DCArtboard id="light-active" label="Active · Legend collapsed" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="active" />
        </DCArtboard>
        <DCArtboard id="light-active-legend" label="Active · Legend open" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="active" legendOpen={true} />
        </DCArtboard>
        <DCArtboard id="light-empty" label="Empty state" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="empty" />
        </DCArtboard>
        <DCArtboard id="light-copy" label="Copy success" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="active" copyState="done" />
        </DCArtboard>
      </DCSection>

      <DCSection id="dark-main" title="Main · Dark theme" subtitle="Notion / Linear-style — soft off-white text, reduced contrast">
        <DCArtboard id="dark-active" label="Active · Legend collapsed" width={DESK.w} height={DESK.h}>
          <GlowShell theme="dark" mode="active" />
        </DCArtboard>
        <DCArtboard id="dark-active-legend" label="Active · Legend open" width={DESK.w} height={DESK.h}>
          <GlowShell theme="dark" mode="active" legendOpen={true} />
        </DCArtboard>
        <DCArtboard id="dark-empty" label="Empty state" width={DESK.w} height={DESK.h}>
          <GlowShell theme="dark" mode="empty" />
        </DCArtboard>
        <DCArtboard id="dark-wrap-L" label="Word wrap · Large font" width={DESK.w} height={DESK.h}>
          <GlowShell theme="dark" mode="active" wrap={true} fontSize="L" />
        </DCArtboard>
      </DCSection>

      <DCSection id="edges" title="Edge states" subtitle="Input warnings, drag-over, processing">
        <DCArtboard id="drag-over" label="Drag-over · Light" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="drag" />
        </DCArtboard>
        <DCArtboard id="large-warn" label="Large input warning" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="active" inputState="large-warn" />
        </DCArtboard>
        <DCArtboard id="too-large" label="Input too large (>10 MB)" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="empty" inputState="too-large" inputOverride="" />
        </DCArtboard>
        <DCArtboard id="binary" label="Binary file error" width={DESK.w} height={DESK.h}>
          <GlowShell theme="dark" mode="empty" inputState="binary-error" inputOverride="" />
        </DCArtboard>
        <DCArtboard id="processing" label="Processing 12,483 lines" width={DESK.w} height={DESK.h}>
          <GlowShell theme="light" mode="processing" processing={{ lines: 12483, progress: 0.62 }} />
        </DCArtboard>
      </DCSection>

      <DCSection id="mobile" title="Mobile · 390 px" subtitle="Stacked panels — input on top, output below">
        <DCArtboard id="m-light" label="Light · Active" width={PHONE.w} height={PHONE.h}>
          <GlowShell theme="light" mode="active" mobile={true} fontSize="S" />
        </DCArtboard>
        <DCArtboard id="m-light-empty" label="Light · Empty" width={PHONE.w} height={PHONE.h}>
          <GlowShell theme="light" mode="empty" mobile={true} />
        </DCArtboard>
        <DCArtboard id="m-dark" label="Dark · Active" width={PHONE.w} height={PHONE.h}>
          <GlowShell theme="dark" mode="active" mobile={true} fontSize="S" />
        </DCArtboard>
        <DCArtboard id="m-drag" label="Dark · Drag-over" width={PHONE.w} height={PHONE.h}>
          <GlowShell theme="dark" mode="drag" mobile={true} />
        </DCArtboard>
      </DCSection>

      <DCSection id="pages" title="Secondary pages" subtitle="Same toolbar / footer · plain text content">
        <DCArtboard id="privacy" label="/privacy" width={DESK.w} height={DESK.h}>
          <PrivacyPage theme="light" />
        </DCArtboard>
        <DCArtboard id="terms" label="/terms" width={DESK.w} height={DESK.h}>
          <TermsPage theme="light" />
        </DCArtboard>
        <DCArtboard id="credits" label="/credits" width={DESK.w} height={DESK.h}>
          <CreditsPage theme="light" />
        </DCArtboard>
        <DCArtboard id="privacy-dark" label="/privacy · Dark" width={DESK.w} height={DESK.h}>
          <PrivacyPage theme="dark" />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

// Expose components + a variants registry so a screenshot harness can render
// one artboard at a time without duplicating layout code.
window.glowVariants = {
  'light-active':         { w: DESK.w, h: DESK.h, label: 'Light · Active',          render: () => <GlowShell theme="light" mode="active" /> },
  'light-active-legend':  { w: DESK.w, h: DESK.h, label: 'Light · Legend open',     render: () => <GlowShell theme="light" mode="active" legendOpen={true} /> },
  'light-empty':          { w: DESK.w, h: DESK.h, label: 'Light · Empty',           render: () => <GlowShell theme="light" mode="empty" /> },
  'light-copy':           { w: DESK.w, h: DESK.h, label: 'Light · Copy success',    render: () => <GlowShell theme="light" mode="active" copyState="done" /> },
  'dark-active':          { w: DESK.w, h: DESK.h, label: 'Dark · Active',           render: () => <GlowShell theme="dark"  mode="active" /> },
  'dark-active-legend':   { w: DESK.w, h: DESK.h, label: 'Dark · Legend open',      render: () => <GlowShell theme="dark"  mode="active" legendOpen={true} /> },
  'dark-empty':           { w: DESK.w, h: DESK.h, label: 'Dark · Empty',            render: () => <GlowShell theme="dark"  mode="empty" /> },
  'dark-wrap-L':          { w: DESK.w, h: DESK.h, label: 'Dark · Wrap · Large',     render: () => <GlowShell theme="dark"  mode="active" wrap={true} fontSize="L" /> },
  'drag-over':            { w: DESK.w, h: DESK.h, label: 'Drag-over · Light',       render: () => <GlowShell theme="light" mode="drag" /> },
  'large-warn':           { w: DESK.w, h: DESK.h, label: 'Large input warning',    render: () => <GlowShell theme="light" mode="active" inputState="large-warn" /> },
  'too-large':            { w: DESK.w, h: DESK.h, label: 'Input too large',        render: () => <GlowShell theme="light" mode="empty" inputState="too-large" inputOverride="" /> },
  'binary':               { w: DESK.w, h: DESK.h, label: 'Binary file error',      render: () => <GlowShell theme="dark"  mode="empty" inputState="binary-error" inputOverride="" /> },
  'processing':           { w: DESK.w, h: DESK.h, label: 'Processing',             render: () => <GlowShell theme="light" mode="processing" processing={{ lines: 12483, progress: 0.62 }} /> },
  'm-light':              { w: PHONE.w, h: PHONE.h, label: 'Mobile · Light',       render: () => <GlowShell theme="light" mode="active" mobile={true} fontSize="S" /> },
  'm-light-empty':        { w: PHONE.w, h: PHONE.h, label: 'Mobile · Light Empty', render: () => <GlowShell theme="light" mode="empty"  mobile={true} /> },
  'm-dark':               { w: PHONE.w, h: PHONE.h, label: 'Mobile · Dark',        render: () => <GlowShell theme="dark"  mode="active" mobile={true} fontSize="S" /> },
  'm-drag':               { w: PHONE.w, h: PHONE.h, label: 'Mobile · Drag-over',   render: () => <GlowShell theme="dark"  mode="drag"   mobile={true} /> },
  'privacy':              { w: DESK.w, h: DESK.h, label: 'Privacy · Light',         render: () => <PrivacyPage theme="light" /> },
  'terms':                { w: DESK.w, h: DESK.h, label: 'Terms · Light',           render: () => <TermsPage   theme="light" /> },
  'credits':              { w: DESK.w, h: DESK.h, label: 'Credits · Light',         render: () => <CreditsPage theme="light" /> },
  'privacy-dark':         { w: DESK.w, h: DESK.h, label: 'Privacy · Dark',          render: () => <PrivacyPage theme="dark" /> },
};

if (!window.__HARNESS_MODE__) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
