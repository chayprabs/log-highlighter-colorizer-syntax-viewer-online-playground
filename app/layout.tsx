import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AppErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark light',
}

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"

export const metadata: Metadata = {
  title: 'Glow — Log syntax highlighter in your browser',
  description:
    'Paste any raw log output and get colour-coded, readable results. Timestamps, error levels, IPs, UUIDs, URLs, and more. Fully client-side — no install, no backend.',
  keywords: [
    'glow',
    'log highlighter',
    'log colorizer',
    'syntax highlight logs',
    'log viewer online',
    'nginx log viewer',
    'developer tools',
    'devops tools',
  ],
  authors: [{ name: 'Chaitanya Prabuddha' }],
  creator: 'Chaitanya Prabuddha',
  applicationName: 'Glow',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#0d0d0d' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    title: 'Glow — Log syntax highlighter',
    description:
      'Paste raw logs for instant highlighting. Runs entirely in your browser.',
    siteName: 'Glow',
  },
  twitter: {
    card: 'summary',
    title: 'Glow',
    description: 'Browser-based log syntax highlighter. Paste and go.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppErrorBoundary>
          {children}
          <OfflineBanner />
        </AppErrorBoundary>
      </body>
    </html>
  )
}
