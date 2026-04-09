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
  themeColor: '#0d0d0d',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  title: 'Log Highlighter — Syntax highlight any log file online',
  description:
    'Paste any log file and get instant color-coded, readable output. Highlights timestamps, log levels, IPs, UUIDs, URLs, HTTP methods, key-value pairs. Zero install, runs in your browser.',
  keywords: [
    'log highlighter',
    'log colorizer',
    'syntax highlight logs',
    'log viewer online',
    'nginx log viewer',
    'kubectl log viewer',
    'log formatter online',
    'developer tools',
    'devops tools',
    'log analysis',
  ],
  authors: [{ name: 'authos' }],
  creator: 'authos',
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
    title: 'Log Highlighter — Syntax highlight any log file online',
    description:
      'Paste any log file and get instant color-coded, readable output. Timestamps, IPs, UUIDs, HTTP methods and more. Zero install.',
    siteName: 'Log Highlighter',
  },
  twitter: {
    card: 'summary',
    title: 'Log Highlighter',
    description: 'Paste any log file and get instant syntax highlighting. Runs in your browser.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
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
