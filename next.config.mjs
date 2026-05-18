import withPWA from 'next-pwa'

/** Set STATIC_EXPORT=1 for Cloudflare Pages / GitHub Pages style hosts (PRD §16). Disables PWA SW build. */
const staticExport = process.env.STATIC_EXPORT === '1'

const cspHeader = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeadersWithoutCsp = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
]

/** CSP omitted in development — Next.js/webpack rely on eval for dev tooling (Playwright uses dev server). */
const securityHeaders =
  process.env.NODE_ENV === 'production'
    ? [...securityHeadersWithoutCsp, { key: 'Content-Security-Policy', value: cspHeader }]
    : securityHeadersWithoutCsp

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(staticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/site.webmanifest',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
    },
    {
      source: '/icon-192x192.png',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
    },
    {
      source: '/icon-512x512.png',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
    },
    {
      source: '/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }, ...securityHeaders],
    },
  ],
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || staticExport,
  register: true,
  skipWaiting: true,
  manifestTransforms: [
    async entries => ({
      manifest: entries.filter(entry => entry.url !== '/_next/app-build-manifest.json'),
      warnings: [],
    }),
  ],
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/data\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https?:\/\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'glow-shell',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
})(nextConfig)
