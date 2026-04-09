# Log Highlighter

A browser-based log file highlighter. Paste any log output and instantly get color-coded, readable results — no installation, no configuration, no backend.

## What it highlights

- Dates and timestamps
- Log severity keywords (ERROR, WARN, INFO, DEBUG, null, true, false)
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- HTTP status codes (200, 404, 500 etc.)
- URLs and their components (protocol, host, path, query params)
- IPv4 addresses
- UUIDs
- Numbers
- Quoted strings
- Unix file paths
- Key-value pairs
- JSON keys

## Running locally

  npm install
  npm run dev

Open http://localhost:3000

## Building for production

  npm run build
  npm start

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Vitest (testing)

## Running tests

  npx vitest run

## License

MIT