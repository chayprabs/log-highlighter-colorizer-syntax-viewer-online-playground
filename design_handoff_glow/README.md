# Glow — Design Handoff

Browser-based log syntax highlighter by **Authos**.
Target stack: **Next.js 14 · React 18 · TypeScript · Tailwind CSS**.

---

## How to use this folder with Cursor

1. Copy `design_handoff_glow/` into your repo (e.g. at the root, or under `/docs`).
2. In Cursor, open this README and `@`-mention it, plus `@source/app.jsx`, `@source/styles.css`, and the `screenshots/` folder.
3. Prompt:

   > Read `design_handoff_glow/README.md` and the files under `design_handoff_glow/source/`. The `screenshots/` folder shows the pixel-perfect target for every state — open each one as you implement so you can match it. These are HTML/JSX/CSS design references — not production code to copy verbatim. Implement this design in our Next.js 14 app at `/`, using Tailwind for styling, the App Router for routing, and TypeScript. Match the design tokens, component structure, states, copy, AND visuals (compare against the screenshots) exactly.

4. Open `Glow Redesign.html` directly in a browser any time you want to see every state laid out on the canvas, or click into a state for an interactive view.

---

## Screenshots — pixel-perfect targets

Every state and page is captured in `screenshots/` at the canvas's native resolution. Compare your Tailwind implementation against these as you build.

### Main app — Light theme
| File | State |
|---|---|
| `01-light-active.jpg` | Active — log loaded, legend collapsed (default landing) |
| `02-light-active-legend.jpg` | Active — legend bar open |
| `03-light-empty.jpg` | Empty input — output panel shows the friendly hint |
| `04-light-copy-success.jpg` | Copy button briefly in success state |

### Main app — Dark theme
| File | State |
|---|---|
| `05-dark-active.jpg` | Active |
| `06-dark-active-legend.jpg` | Active — legend open |
| `07-dark-empty.jpg` | Empty |
| `08-dark-wrap-large.jpg` | Word wrap on, font size = Large |

### Edge states
| File | State |
|---|---|
| `09-drag-over.jpg` | File dragged over input panel — dashed overlay |
| `10-large-input-warning.jpg` | `> 1 MB` — amber warning in input footer |
| `11-input-too-large.jpg` | `> 10 MB` — red error, input cleared |
| `12-binary-file-error.jpg` | Dropped a non-text file — red error in dark theme |
| `13-processing.jpg` | `> 5000 lines` — progress bar + live count |

### Mobile (390 × 844)
| File | State |
|---|---|
| `14-mobile-light-active.jpg` | Stacked panels, icon-only toolbar, light theme |
| `15-mobile-light-empty.jpg` | Empty mobile light |
| `16-mobile-dark-active.jpg` | Stacked panels, dark theme |
| `17-mobile-dark-drag.jpg` | Drag-over on mobile, dark theme |

### Secondary pages
| File | State |
|---|---|
| `18-privacy-light.jpg` | `/privacy` light |
| `19-terms-light.jpg` | `/terms` light |
| `20-credits-light.jpg` | `/credits` light |
| `21-privacy-dark.jpg` | `/privacy` dark (same component, theme=dark) |

---

## About the design files

The files in `source/` are **design references created as a working HTML prototype**, not production code to copy directly. They:

- Use inline React + Babel via `<script type="text/babel">` — not the target setup.
- Use vanilla CSS with custom properties (`--bg`, `--accent`, `--t-error`, etc.) — the target uses Tailwind, so most of these become `tailwind.config.ts` theme tokens or `@layer` CSS variables.
- Render every state as a separate artboard on a design canvas, so Cursor (or any reader) can see every variant in one place.

Your job is to **recreate these designs in the Next.js + Tailwind app**, using the codebase's conventions. The CSS variable names and component class names in `source/styles.css` are a useful naming scheme to lift — but feel free to rename them to fit your codebase.

## Fidelity

**High-fidelity.** Pixel-perfect mockups with final colors, typography, spacing, layout, and copy. All hex values, all font sizes, all line-heights, all paddings, and all microcopy in the references are the intended values. Match them.

---

## Routes / pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `<GlowApp />` | Main two-panel app — input on left, highlighted output on right |
| `/privacy` | `<PrivacyPage />` | Static text page |
| `/terms` | `<TermsPage />` | Static text page |
| `/credits` | `<CreditsPage />` | Static text page |

All routes share the same `<Toolbar />` and `<Footer />` shell. Implement as an App Router layout (`app/layout.tsx`).

---

## Design tokens

### Colors — Light theme (default)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Page background, output panel |
| `--chrome` | `#f7f8fb` | Toolbar, footer, **input panel** |
| `--hair` | `#ececf2` | Hairline borders |
| `--hair-strong` | `#d8dae3` | Stronger borders (button outlines) |
| `--fg` | `#1a1a2e` | Primary text |
| `--fg-muted` | `#5a5f6e` | Secondary text, labels |
| `--fg-faint` | `#8b8f9c` | Tertiary text, line numbers |
| `--fg-placeholder` | `#9aa0b0` | Textarea placeholder |
| `--accent` | `#4f46e5` | Brand mark, focus, output stripe |
| `--output-stripe` | `#4f46e5` | 2 px top stripe on output panel |

### Colors — Dark theme

| Token | Value |
|---|---|
| `--bg` | `#0f1117` |
| `--chrome` | `#13141a` |
| `--hair` | `#1f2129` |
| `--hair-strong` | `#2a2d37` |
| `--fg` | `#d4d6e0` *(soft off-white — NOT pure white)* |
| `--fg-muted` | `#8a8e99` |
| `--fg-faint` | `#5b5f6c` |
| `--accent` | `#818cf8` |
| `--output-bg` | `#1a1d28` *(lighter than chrome — output reads as elevated)* |
| `--output-stripe` | `#818cf8` |

### Token colors (log highlighting)

| Token type | Light | Dark | Match pattern |
|---|---|---|---|
| `timestamp` | `#2563eb` | `#60a5fa` | ISO-8601 timestamps |
| `error` | `#dc2626` | `#f87171` | `ERROR`, `ERR` |
| `fatal` | `#b91c1c` | `#fb7185` | `FATAL`, `CRITICAL`, `EMERG` |
| `warn` | `#c2700a` | `#fbbf24` | `WARN`, `WARNING`, `ALERT` |
| `info` | `#16a34a` | `#4ade80` | `INFO`, `INFORMATION` |
| `debug` | `#6b7280` | `#9ca3af` | `DEBUG`, `TRACE`, `VERBOSE` |
| `method` | `#7c3aed` | `#c4b5fd` | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, `CONNECT`, `TRACE` |
| `status-2xx` | `#16a34a` | `#4ade80` | HTTP 200–299 |
| `status-3xx` | `#ca8a04` | `#fcd34d` | HTTP 300–399 |
| `status-4xx` | `#ea580c` | `#fb923c` | HTTP 400–499 |
| `status-5xx` | `#dc2626` | `#f87171` | HTTP 500–599 |
| `url` | `#2563eb` | `#60a5fa` | `https?://…` |
| `ip` | `#0891b2` | `#67e8f9` | IPv4 with optional `:port` |
| `uuid` | `#c026a8` | `#f0abfc` | UUID v1–v5 |
| `path` | `#ea580c` | `#fdba74` | `/foo/bar/baz` |
| `string` | `#15803d` | `#86efac` | `"…"` or `'…'` |
| `number` | `#a16207` | `#fde68a` | bare integer or decimal |
| `boolean` | `#9333ea` | `#d8b4fe` | `true`, `false`, `null`, `None`, `nil` |

Exact regex patterns are in `source/tokenize.js` — copy that file's `patterns` array directly into a TypeScript module.

### Status-state colors (for warning / error footers)

| Token | Light | Dark |
|---|---|---|
| `--warn-bg` | `#fff8eb` | `#2a230f` |
| `--warn-fg` | `#b45309` | `#fbbf24` |
| `--warn-border` | `#f7d49a` | `#4d3f1b` |
| `--error-bg` | `#fef2f2` | `#2a1416` |
| `--error-fg` | `#b91c1c` | `#fb7185` |
| `--error-border` | `#fbcaca` | `#4d2026` |

### Typography

- **UI font:** `Plus Jakarta Sans` (Google Fonts, weights 400 / 500 / 600 / 700 / 800). Used everywhere except log content.
- **Mono font:** `JetBrains Mono` (Google Fonts, weights 400 / 500 / 600 / 700). Used **only** inside textareas and the output `<pre>`.
- Body font size: **14 px**, line-height 1.45, letter-spacing `-0.005em`.
- Log content: 12 px (S) / 13 px (M) / 15 px (L), line-height 1.55–1.65, tab-size 4.

### Spacing & radii

- Toolbar / footer horizontal padding: **24 px**
- Panel header / footer horizontal padding: **20 px**
- Textarea inner padding: **18 px 20 px**
- Button height: 30 px · radius 7 px
- Icon button height: 32 px · radius 8 px
- Brand mark: 28×28, radius 8 px, indigo gradient
- Hairline: 1 px

### Sizes

| Region | Height |
|---|---|
| Toolbar | 56 px (52 px on mobile) |
| Legend (open) | ~44 px |
| Legend (collapsed) | 0 px (grid-row transition) |
| Panel header | 48 px |
| Panel footer | 44 px |
| App footer | 38 px |

---

## Component breakdown

### `<Toolbar />`

- Left: brand mark (28×28 indigo gradient tile with sun-burst glyph) + wordmark `Glow` (700, 17 px, `-0.02em`) + tagline `Log syntax highlighting in your browser` (500, 13 px, `--fg-muted`), separated from the wordmark by a 1 px vertical hairline.
- Right cluster, in order: segmented font-size control `S | M | L` (`<Segmented>`), divider, line-numbers toggle (`#` icon), word-wrap toggle (wrap-arrow icon), theme toggle (sun/moon), divider, Legend toggle (`☰` icon + `Legend` label).
- All icon buttons are 32 px tall with 8 px radius. Active state: indigo text on `--accent-soft` (`color-mix(in srgb, var(--accent) 12%, transparent)`).
- On mobile (`< 640px`): hide tagline, hide segmented font-size control, hide button labels, drop dividers.

### `<Legend />`

- Horizontal flex row of 17 items (one per token type): a 10×10 colored dot with a 3 px halo (`box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 12%, transparent)`) + label (500, 12.5 px).
- Animated open/close via `grid-template-rows: 0fr → 1fr` and `overflow: hidden` on the inner element. **Collapsed by default.**

### `<InputPanel />`

- Sits on `--chrome` background. Right border `1 px solid var(--hair)`.
- Header: bullet dot (6 px, `--accent`) + `INPUT` (700, 12 px, uppercase, letter-spacing `0.12em`). Right: hint `paste · drop · type` (500, 12.5 px, `--fg-faint`).
- Body: full-bleed `<textarea>` with `JetBrains Mono`, transparent background, no border, no outline, indigo caret.
- Footer: left = live stats `{lines} lines · {bytes}` (12.5 px, `--fg-muted`, bold count); right = `Clear` (ghost button) + `Load Example` (outlined button).
- **Drag-over state:** absolutely-positioned overlay (`inset: 12px`) with 2 px dashed indigo border, 12 px radius, soft indigo wash background. Center stack: 48 px indigo-soft icon tile (upload glyph), title `Drop your log file here` (600, 16 px), subtitle `Supports .log · .txt · plain text up to 10 MB`.

### `<OutputPanel />`

- Sits on `--bg` (pure white in light mode) / `--output-bg` (lighter than chrome in dark mode).
- **Thin 2 px indigo stripe along the top edge** (`::before`, `top: 0; left: 0; right: 0; height: 2px; background: var(--output-stripe)`). This is what visually separates input from output — do not skip it.
- Header: same dot + `OUTPUT` title. Right: `Copy` and `Download` buttons (outlined, 30 px, with icon + label).
- Body: vertically-scrollable `<pre>` containing one `.gs-out-line` per log line.
  - If line numbers on: left gutter 56 px wide (32 px on mobile), right-aligned, tabular-nums, `--fg-faint`.
  - Line hover: `background: color-mix(in srgb, var(--fg) 4%, transparent)`.
  - Word wrap on: `white-space: pre-wrap; word-break: break-word` on the content span.
  - Word wrap off: horizontal scroll on the `<pre>`.
- Footer: `{N} lines · UTF-8` left, `plain text` right (both 12.5 px, muted).

### `<Footer />`

- Left: 12 px lock icon + `Nothing leaves your browser. Log content is processed locally. No data sent to any server.` (500, 12.5 px, `--fg-muted`).
- Right: `© 2026 Chaitanya Prabuddha · Privacy · Terms` — links use `--fg-muted` → `--fg` on hover.

---

## States to implement

| State | Trigger | Visual diff |
|---|---|---|
| **Active** | Default with content | Highlighted log lines in output |
| **Empty** | Input textarea is empty | Output shows centered glyph + `Highlighted output will appear here` + subtitle + arrow hint `← Start in the input panel` (or `↑ Add input above` on mobile). Copy & Download buttons hidden. |
| **Drag-over** | A file is dragged over the input panel | Overlay described above |
| **Large input warning** | Input size > 1 MB | Replace the stats row in the input footer with `⚠ Large input — highlighting may take a moment.` in `--warn-*` colors |
| **Input too large** | Input size > 10 MB | Replace stats with `⊘ Input exceeds the 10 MB limit.` in `--error-*` colors. Clear the textarea. |
| **Binary file** | Dropped file fails text detection | Replace stats with `⊘ This does not appear to be a text file.` (same error treatment) |
| **Processing** | More than 5000 lines being highlighted | Output shows centered `Highlighting {N} lines…` + horizontal progress bar (4 px tall, `min(360px, 60%)` wide, indigo fill, scaleX transform) + `{pct}% · {done} / {total} lines` (mono, 12.5 px) |
| **Copy success** | User clicked Copy | Copy button briefly: `--t-info` colored, check icon, label `Copied`. Reverts after ~1.4 s |

All states are rendered as separate artboards in `Glow Redesign.html` so you can open it and look.

---

## Interaction behavior

- **Paste / type** in the textarea → re-tokenize and render in output. Tokenize on a microtask / `requestIdleCallback` for large inputs.
- **Drop** a file on the input panel → read with `FileReader`, set textarea value. Reject if `file.size > 10 MB` (binary detection: scan first 4 KB for null bytes or invalid UTF-8). Show the appropriate error.
- **Clear** button → empty the textarea, switch to empty state.
- **Load Example** → set the textarea to the sample in `source/example-log.js`.
- **Copy** → `navigator.clipboard.writeText(rawText)`, flash success state for 1.4 s.
- **Download** → `Blob(['…'], { type: 'text/plain' })` → object URL → anchor with `download="glow.log"`.
- **Theme toggle** → flip `data-theme` attribute on the shell (or `html` element). **Do not persist** — spec says no localStorage. Read `prefers-color-scheme` on first mount as the initial value.
- **Legend / line numbers / wrap / font-size** toggles → ephemeral UI state, not persisted.
- **Mobile (< 640 px)**: stack panels vertically (input ~38%, output ~62%), collapse toolbar to icon-only.

---

## Tokenizer

`source/tokenize.js` is **production-ready logic** — port it to TypeScript verbatim:

- One combined regex of alternations, evaluated per line.
- Patterns checked in priority order so the more specific pattern wins the index (quoted strings before timestamps before UUIDs, etc.).
- Output is `Line[]` where each line is `Token[]` and each token is `{ type: TokenType, text: string }`.
- `status` tokens are post-classified by numeric range into `status-2xx` / `3xx` / `4xx` / `5xx`.

Recommended port:

```ts
// app/lib/tokenize.ts
export type TokenType =
  | 'plain' | 'string' | 'timestamp' | 'uuid' | 'ip' | 'method'
  | 'fatal' | 'error' | 'warn' | 'info' | 'debug'
  | 'boolean' | 'url' | 'path' | 'number'
  | 'status-2xx' | 'status-3xx' | 'status-4xx' | 'status-5xx';

export interface Token { type: TokenType; text: string }
export function tokenize(text: string): Token[][] { /* … */ }
```

For inputs > 5000 lines, run tokenization in a Web Worker and drive the progress bar from the worker's chunked output.

---

## Suggested Tailwind config (theme extension)

```ts
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
    },
    colors: {
      // Use CSS variables so dark mode works via [data-theme="dark"]
      bg:     'var(--bg)',
      chrome: 'var(--chrome)',
      hair:   'var(--hair)',
      'hair-strong': 'var(--hair-strong)',
      fg:        'var(--fg)',
      'fg-muted':  'var(--fg-muted)',
      'fg-faint':  'var(--fg-faint)',
      accent:    'var(--accent)',
      'output-bg': 'var(--output-bg)',
      // token colors
      't-timestamp': 'var(--t-timestamp)',
      // …etc
    },
  },
},
```

Define both palettes in `app/globals.css` under `:root` and `[data-theme="dark"]`. The full var lists are at the top of `source/styles.css` — copy them.

---

## Page content (use verbatim)

The exact body copy for `/privacy`, `/terms`, `/credits` lives in `source/app.jsx` under `PrivacyPage`, `TermsPage`, `CreditsPage`. Keep the wording as-is — it was reviewed.

---

## Files in this folder

```
design_handoff_glow/
├── README.md                 ← THIS FILE — read first
├── Glow Redesign.html        ← open in a browser to see every state on a canvas
├── screenshots/              ← pixel-perfect targets (21 captures)
│   ├── 01-light-active.jpg … 21-privacy-dark.jpg
└── source/                   ← design reference code (NOT production-ready)
    ├── styles.css            ← all CSS, including the :root token block — copy this
    ├── app.jsx               ← every React component (GlowShell, panels, pages)
    ├── tokenize.js           ← the regex tokenizer — port verbatim to TypeScript
    ├── example-log.js        ← sample content for the "Load Example" button
    └── design-canvas.jsx     ← canvas chrome — DO NOT implement
```

---

## Suggested Next.js file layout

```
app/
├── layout.tsx                 ← shared Toolbar + Footer, font loading, theme attr
├── globals.css                ← copy --bg, --chrome, … from source/styles.css
├── page.tsx                   ← the main two-panel app (server component shell + client island)
├── privacy/page.tsx
├── terms/page.tsx
├── credits/page.tsx
└── lib/
    ├── tokenize.ts            ← port of source/tokenize.js (typed)
    ├── tokens.ts              ← TokenType union + colour map
    └── example-log.ts         ← export const EXAMPLE_LOG = `…`
components/
├── Toolbar.tsx                ← brand mark + tagline + tool buttons
├── Legend.tsx                 ← collapsible dot+label row
├── InputPanel.tsx             ← textarea, drag handling, footer stats / state msgs
├── OutputPanel.tsx            ← gutter, highlighted <pre>, empty + processing states
├── Footer.tsx                 ← privacy line + links
├── Tokens.tsx                 ← <span> renderer per Token[]
├── DropOverlay.tsx
├── ProgressBar.tsx
└── icons/                     ← single-file SVG components (or use a lib if you have one)
```

Use a **single client component** at `app/page.tsx` for the main app — server-rendering would block the textarea/clipboard logic.

---

## Things NOT to implement

- The design canvas chrome (`DesignCanvas`, `DCSection`, `DCArtboard`) — that's the presentation layer for reviewing the design, not part of the product.
- Persistence (`localStorage`, cookies) — the privacy page commits to "nothing stored locally."
- Server-side anything for log content — Glow is fully client-side.
- Marketing copy, hero illustrations, gradients, or decorative graphics — the spec is deliberately clean.

---

## Acceptance criteria (use these to self-check)

A correct implementation must visually match the screenshots and:

- [ ] `Plus Jakarta Sans` loads from Google Fonts, used for all chrome (toolbar, footer, panel headers, buttons, page body text).
- [ ] `JetBrains Mono` loads from Google Fonts, used **only** inside the textarea, the output `<pre>`, and the inline `<kbd>` chips on the secondary pages.
- [ ] Light theme is the default; the system reads `prefers-color-scheme` for the initial value but does **not** persist anything.
- [ ] The output panel has a thin 2 px indigo stripe across its top edge (`var(--output-stripe)`).
- [ ] The input panel sits on `--chrome` (`#f7f8fb` light / `#13141a` dark). The output panel sits on `--bg` (light) or `--output-bg` (dark) — these are visibly different from the chrome.
- [ ] Dark theme primary text is `#d4d6e0`, NOT pure white.
- [ ] Light theme background is pure `#ffffff`, NOT cream.
- [ ] All 17 token types render with their light + dark palettes (see token-color table).
- [ ] HTTP status codes are post-classified into `2xx / 3xx / 4xx / 5xx` after numeric match.
- [ ] The brand mark is a 28×28 rounded indigo gradient tile with a sun-burst glyph (see screenshot 01).
- [ ] The Legend bar collapses to 0 height and expands to fit the dot+label row, with a transition.
- [ ] On mobile (< 640 px), panels stack input-on-top, output-below, and the toolbar drops dividers, tagline, button labels, and the S/M/L control.
- [ ] The textarea accepts file drops, with a dashed indigo overlay that says `Drop your log file here` (see screenshot 09).
- [ ] Pasting > 5000 lines shows the `Highlighting {N} lines…` overlay + progress bar in the output panel.
- [ ] The Copy button briefly turns green and reads `Copied` for ~1.4 s after success (see screenshot 04).
- [ ] All page copy is taken verbatim from `source/app.jsx` (the `PrivacyPage`, `TermsPage`, `CreditsPage` components).
- [ ] No `localStorage`, no cookies, no analytics scripts.

If any of these are not yet matching: open the relevant screenshot in `screenshots/` and reconcile.

---

## Open questions / decisions for you to make

- **Share-via-URL feature** (mentioned on Privacy page using lz-string) is referenced but not designed. Add a Share button next to Copy/Download if you choose to implement it.
- **PWA / offline** (`next-pwa`) is mentioned on Credits but not shown in the UI. Add to your build pipeline if desired; no UI affordance needed.
- **Keyboard shortcuts** — not designed. Consider `⌘K` to focus input, `⌘C` global copy, `⌘L` to load example.
