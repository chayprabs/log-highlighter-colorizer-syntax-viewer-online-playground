import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy — Glow',
  description: 'Privacy notice for the Glow log highlighter.',
}

export default function PrivacyPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <p className="mb-6">
        <Link href="/" className="text-cyan-600 underline dark:text-cyan-400">
          ← Back to Glow
        </Link>
      </p>
      <h1 className="mb-6 text-3xl font-bold">Privacy</h1>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Data we collect</h2>
        <p>
          Glow collects nothing. Log content you paste is processed entirely within your browser using JavaScript. No log
          content is transmitted to any server, stored in any database, or shared with any third party.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">URL sharing</h2>
        <p>
          If you use the share link feature, your log content is compressed and placed in the URL fragment (the part after
          #). URL fragments are not sent to any server — they are processed by your browser only. If you share the link
          with someone, the log content will be visible to them.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Cookies</h2>
        <p>Glow does not set any cookies. Your hosting provider may set short-lived security cookies as part of standard network delivery.</p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p>None. Glow does not include analytics, tracking pixels, or telemetry.</p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">localStorage</h2>
        <p>
          Glow does not use localStorage to persist log content or settings between sessions. Your log content exists only in
          the current browser tab.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Service worker</h2>
        <p>
          Glow uses a service worker for offline support. The service worker caches the application&apos;s static files
          (JavaScript, CSS, icons) — it does not cache your log content.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For questions about this privacy notice, see the{' '}
          <a
            className="text-cyan-600 underline dark:text-cyan-400"
            href="https://github.com/chayprabs"
            rel="noopener noreferrer"
          >
            maintainer on GitHub
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-neutral-500">Last updated: May 17, 2026</p>
    </div>
  )
}
