export const SITE = {
  name: 'Glow',
  tagline: 'Log syntax highlighter in your browser',
  description:
    'Paste raw log output and get instant colour-coded results — timestamps, error levels, HTTP status codes, URLs, IPs, and UUIDs. Fully client-side, no install, no backend.',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://log-highlighter-colorizer-syntax-viewer-online-playground.vercel.app',
  githubUrl: 'https://github.com/chayprabs/log-highlighter-colorizer-syntax-viewer-online-playground',
  twitterUrl: 'https://x.com/chayprabs',
  websiteUrl: 'https://www.chaitanyaprabuddha.com',
  author: 'Chaitanya Prabuddha',
  contactEmail: 'hello@chaitanyaprabuddha.com',
} as const
