# Glow

**Glow** (npm package `log-highlighter`) is a **browser-based log syntax highlighter** and **online log viewer**. Paste raw log output—application logs, **nginx** access lines, **syslog**, **JSON** lines, or one-off snippets—and get **instant colour-coded** output: **timestamps**, **log levels**, **HTTP methods and status codes**, **URLs**, **IPv4**, **UUIDs**, **paths**, **quoted strings**, **numbers**, and **literals**. Everything runs **fully client-side** in JavaScript. **No WASM**, **no server**, **no accounts**, **no analytics**.

Repository: [log-highlighter-colorizer-syntax-viewer-online-playground](https://github.com/chayprabs/log-highlighter-colorizer-syntax-viewer-online-playground) · Owner: **Chaitanya Prabuddha** ([@chayprabs](https://github.com/chayprabs))

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## Why Glow exists

Raw logs are noisy: **ERROR** lines look like **INFO**, timestamps blend in, and **UUIDs** or **IPs** are hard to spot. Engineers paste into editors or configure IDE plugins. **Glow** is **paste-and-go**: open a tab, paste, read—**zero install**, **zero configuration**, **zero backend**.

---

## Features

| Capability | Details |
|------------|---------|
| **Highlighting engine** | Priority-ordered tokens rendered as React text nodes (safe by default) |
| **Themes** | Light (default) / dark |
| **Viewer** | Toggle **line numbers**, **word wrap**, **font size** (S / M / L) |
| **Legend** | Collapsible panel describing each token type and colour |
| **Large inputs** | **10 MB** hard limit; **1 MB** warning; **> 5 000 lines** uses **chunked** highlighting with progress |
| **File drop** | Plain text files up to **10 MB**; **binary sniff** rejects non-text |
| **Share via URL** | Full workspace in **`#state=`** via **lz-string**; copy link from toolbar |
| **PWA** | **next-pwa** — offline app shell after first load |
| **Privacy** | No log data sent to a server; see [`/privacy`](./app/privacy/page.tsx) |
| **Legal** | [`/terms`](./app/terms/page.tsx), [`/privacy`](./app/privacy/page.tsx) |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 14.2.x** (App Router) |
| UI | **React 18**, **TypeScript 5**, **Tailwind CSS 3** |
| URL state | **lz-string** 1.5.x |
| PWA | **next-pwa** 5.6.x |
| Tests | **Vitest** 4.1.x, **Playwright** 1.56.x |

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

**Deploy:** Vercel-friendly (`vercel.json`); static export via `STATIC_EXPORT=1` for Cloudflare Pages.

Set `NEXT_PUBLIC_SITE_URL` to your production URL for correct sitemap and Open Graph metadata.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit) |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run build:static` | Static export (`STATIC_EXPORT=1`) |

CI (GitHub Actions): TypeScript, ESLint, license check, Vitest, Playwright E2E, Next.js build, static export smoke.

---

## Repository topics (GitHub)

Suggested topics for discoverability:

```
glow
log-highlighter
log-viewer
syntax-highlighting
developer-tools
client-side
privacy-first
pwa
nextjs
react
typescript
open-source
```

---

## FAQ

### Does my log content leave my browser?

**No** for normal use. Logs are processed in-tab with JavaScript. See the **[Privacy Policy](./app/privacy/page.tsx)**.

### What happens if I use Share?

Your content is compressed into the URL **fragment** (`#state=…`). Fragments are not sent to servers in HTTP requests, but anyone with the full URL can decode them.

### What are the limits?

| Limit | Value |
|-------|--------|
| Input / file (hard) | **10 MB** |
| Input (warning) | **1 MB** |
| Chunked highlighting | After **5 000 lines** |
| URL state (encoded) | **8 000** characters |

### License?

**MIT** — see **[LICENSE](./LICENSE)**. Copyright © **2026 Chaitanya Prabuddha**.

### Security?

See **[SECURITY.md](./SECURITY.md)** for vulnerability reporting.

---

## Contributing

Issues and PRs are welcome on GitHub.

---

*Glow — readable logs in one paste.*
