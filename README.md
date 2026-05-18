# Glow

**Glow** (npm package `log-highlighter`) is a **browser-based log syntax highlighter** and **online log viewer**. Paste raw log output—application logs, **nginx** access lines, **syslog**, **JSON** lines, or one-off snippets—and get **instant colour-coded** output: **timestamps**, **log levels**, **HTTP methods and status codes**, **URLs**, **IPv4**, **UUIDs**, **paths**, **key–value pairs**, **quoted strings**, **numbers**, and **literals**. Everything runs **fully client-side** in JavaScript using **regex** patterns. **No WASM**, **no server**, **no accounts**, **no analytics**.

Repository: **log-highlighter-colorizer-syntax-viewer-online-playground** · Suite: **Authos** ([authos.app](https://authos.app)) · Owner: **Chaitanya Prabuddha** ([@chayprabs](https://github.com/chayprabs))

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## Why Glow exists

Raw logs are noisy: **ERROR** lines look like **INFO**, timestamps blend in, and **UUIDs** or **IPs** are hard to spot. Engineers paste into editors or configure IDE plugins. **Glow** is **paste-and-go**: open a tab, paste, read—**zero install**, **zero configuration**, **zero backend**.

---

## Features (from the product spec)

| Capability | Details |
|------------|---------|
| **Highlighting engine** | Priority-ordered tokens; **HTML-escaped** user text before any `<span>`; `dangerouslySetInnerHTML` only on engine output |
| **Themes** | Dark / light |
| **Viewer** | Toggle **line numbers**, **word wrap**, **font size** (small / medium / large) |
| **Token filters** | Enable or disable individual token types from the toolbar |
| **Legend** | Collapsible panel describing each token type and colour |
| **Large inputs** | **10 MB** hard limit; **1 MB** warning; **> 5 000 lines** uses **chunked** highlighting with a progress message; jobs can be **cancelled** when input changes |
| **Safety** | Per-line **100 ms** budget (falls back to plain escaped text); **quoted strings** capped (e.g. **500** chars inside quotes) to reduce **ReDoS** risk |
| **File drop** | Plain text files up to **10 MB**; **binary sniff** (null bytes in first **1 KB**) rejects non-text |
| **Share via URL** | Full workspace (text + settings) in **`#state=`** via **lz-string**; **8 000**-character encoded guard; debounced **300 ms** |
| **PWA** | **next-pwa** — offline app shell after first load; service worker **disabled in development** |
| **Privacy** | No log data sent to a server; see [`/privacy`](./app/privacy/page.tsx) on a deployed instance |
| **Legal** | [`/terms`](./app/terms/page.tsx), [`/credits`](./app/credits/page.tsx) (third-party MIT attributions) |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 14.2.x** (App Router) |
| UI | **React 18**, **TypeScript 5**, **Tailwind CSS 3** |
| URL state | **lz-string** 1.5.x |
| PWA | **next-pwa** 5.6.x |
| Tests | **Vitest** 4.1.x |

Execution model: **100% client-side**; highlighting is **synchronous** for smaller logs and **async-chunked** for very large ones.

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The service worker is off in dev.

```bash
npm run build
npm start
```

**Deploy:** Vercel-friendly (`vercel.json`); static-friendly headers in **`next.config.mjs`** and **`public/_headers`** (e.g. Cloudflare Pages).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright smoke (PRD §18) |
| `npm run build:static` | Static export (`STATIC_EXPORT=1`, PRD §16) |

CI (GitHub Actions): TypeScript, ESLint, production **license-checker** (no GPL/AGPL/LGPL), Vitest, Playwright E2E, Next.js build, static export smoke.

---

## Repository topics (GitHub “tags”)

GitHub discovers repositories through **About → Topics**. Add up to **20** topics for SEO and browsing. Suggested set (copy any subset):

```
glow
log-highlighter
log-viewer
log-syntax-highlighting
syntax-highlighting
developer-tools
devops
sre-tools
nginx-logs
syslog
kubernetes-logs
client-side
privacy-first
pwa
offline-capable
nextjs
react
typescript
tailwindcss
open-source
```

Optional extras to rotate in: `regex`, `lz-string`, `vercel`, `static-site`, `log-colorizer`, `browser-tools`, `mit-license`, `authos`.

---

## FAQ

### Does my log content leave my browser?

**No** for normal use. Logs are processed in-tab with JavaScript. Nothing is sent to Glow’s application server for highlighting. See the in-app notice and the **[Privacy](./app/privacy/page.tsx)** page.

### What happens if I use “Share link”?

Your content is **compressed** and placed in the URL **fragment** (`#state=…`). **Fragments are not sent over the network** to the server as part of the HTTP request—they stay in the browser. Anyone you send the **full URL** to can decode the fragment, so treat shared links like sensitive data.

### Do you use cookies, analytics, or localStorage?

**No cookies** from the app, **no analytics**, **no localStorage** for logs or settings (per product privacy model). Hosting providers may set their own short-lived infrastructure cookies.

### What are the limits?

| Limit | Value |
|-------|--------|
| Input / file (hard) | **10 MB** |
| Input (warning) | **1 MB** (“large input” message) |
| Chunked highlighting | After **5 000 lines** (batches of **1 000**) |
| Per-line highlight budget | **100 ms** (then plain escaped line) |
| URL state (encoded) | **8 000** characters (sync skipped with user-facing message) |
| URL sync debounce | **300 ms** |

### Is highlighted HTML safe?

User text is **HTML-escaped** before wrapping. Only the highlighter’s `<div class="log-line">` and `<span class="token-…">` structure is injected. Do not bypass the engine when rendering.

### How does this compare to an IDE or `cat`?

Glow is for **quick visual inspection** in a browser tab—no repo, no plugin sync, no install. It is **not** a structured log platform, SQL over logs, grep UI, or custom user regex editor (those are out of scope for v1 per the PRD).

### License?

**MIT** — see **[LICENSE](./LICENSE)**. Copyright © **2026 Chaitanya Prabuddha**.

### Where is the code?

- **Highlighter:** [`lib/highlighter.ts`](./lib/highlighter.ts)  
- **URL state:** [`lib/urlState.ts`](./lib/urlState.ts)  
- **File drop:** [`lib/fileReader.ts`](./lib/fileReader.ts)  
- **UI:** [`components/`](./components/), [`app/page.tsx`](./app/page.tsx)

---

## Security & headers

Strict **Content-Security-Policy**, **`X-Frame-Options: DENY`**, **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy`**, **`Permissions-Policy`**, **`Strict-Transport-Security`**, and **`X-XSS-Protection: 0`** are configured for deployment (see `vercel.json` and `next.config.mjs`). A CSP **meta** tag is also set from the root layout for consistency.

---

## Keywords for search (SEO)

If you are searching for this project, it is also: **log colorizer online**, **syntax highlight logs in browser**, **paste logs for colors**, **nginx log highlighter**, **kubectl log viewer style highlighting**, **offline log viewer PWA**, **client-side log formatter**, **developer log tool**, **regex log tokenizer**, **MIT log highlighter**.

---

## Contributing & support

Issues and PRs are welcome on GitHub. For privacy questions on a specific deployment, contact the operator of that deployment (see your instance’s **Privacy** page).

---

*Glow — readable logs in one paste.*
