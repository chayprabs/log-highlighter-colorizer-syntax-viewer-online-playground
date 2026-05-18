import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AppErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#4f46e5',
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
  authors: [{ name: 'Authos' }],
  creator: 'Authos',
  applicationName: 'Glow',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#4f46e5' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    title: 'Glow — Log syntax highlighter',
    description: 'Paste raw logs for instant highlighting. Runs entirely in your browser.',
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
}>): JSX.Element {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        {process.env.NODE_ENV === 'production' ? (
          <meta httpEquiv="Content-Security-Policy" content={CSP} />
        ) : null}
      </head>
      <body style={{ height: '100%', margin: 0 }}>
        <AppErrorBoundary>
          {children}
          <OfflineBanner />
        </AppErrorBoundary>
      </body>
    </html>
  )
}
