import withPWA from 'next-pwa'

// All security headers from the previous security prompt
// (keep whatever headers are already configured here — do not remove them)
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'none'",
      "script-src 'self' 'unsafe-inline'",
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
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [{ source: '/(.*)', headers: securityHeaders }],
}

export default withPWA({
  dest: 'public', // service worker goes in public/
  disable: process.env.NODE_ENV === 'development', // disable in dev to avoid confusion
  register: true, // auto-register service worker
  skipWaiting: true, // new SW takes over immediately
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
      // Cache all same-origin requests (the entire app shell)
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'log-highlighter-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})(nextConfig)
