import withPWA from 'next-pwa'

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

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Content-Security-Policy', value: cspHeader },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  disable: process.env.NODE_ENV === 'development',
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
