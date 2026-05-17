# Glow (`log-highlighter`)

Glow is a browser-based log syntax highlighter. Paste raw log output and get colour-coded output — timestamps, severities, HTTP details, IPs, UUIDs, URLs, and more. Everything runs **fully client-side** in JavaScript (regex-based). No WASM, no backend, no accounts.

## Product

- **Workspace**: paste input, highlighted output, toolbar (theme, line numbers, word wrap, font size, token filters, legend, share link).
- **URL state**: full workspace (including pasted text) is LZ-string compressed into the `#state=` hash with an 8,000-character guard.
- **PWA**: offline shell via `next-pwa` (service worker disabled in `npm run dev`).
- **Legal pages**: `/privacy`, `/terms`, `/credits`.

## Scripts

```bash
npm install
npm run dev      # http://localhost:3000 — no service worker in dev
npm run build
npm start
npm run lint
npm test
npm run test:coverage
```

## Stack

Next.js 14, React 18, TypeScript 5, Tailwind CSS 3, Vitest 4, lz-string, next-pwa.

## License

MIT — see [LICENSE](./LICENSE). Copyright © 2026 Chaitanya Prabuddha.
