import type { Metadata } from 'next'
import { GlowShell } from '@/components/glow/GlowShell'

export const metadata: Metadata = {
  title: 'Privacy — Glow',
  description: 'Privacy notice for the Glow log highlighter.',
}

export default function PrivacyPage(): JSX.Element {
  return (
    <GlowShell>
      <div className="gs-page-inner">
        <div className="gs-page-eyebrow">Privacy</div>
        <h1 className="gs-page-title">Your logs stay on your machine.</h1>
        <p className="gs-page-lede">
          Glow runs entirely in your browser. We don&apos;t operate a backend that sees your log content, and we
          don&apos;t want to.
        </p>

        <section className="gs-page-section">
          <h2>What we collect</h2>
          <p>
            Nothing. Glow doesn&apos;t have an account system, doesn&apos;t set cookies, and doesn&apos;t include any
            analytics, telemetry, or tracking scripts.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>What stays on your device</h2>
          <ul className="gs-page-list">
            <li>The text you paste or drop into the Input panel never leaves the page.</li>
            <li>Highlighting and tokenization happen in JavaScript running locally.</li>
            <li>
              Glow does not persist anything to <span className="gs-page-kbd">localStorage</span> or IndexedDB.
            </li>
          </ul>
        </section>

        <section className="gs-page-section">
          <h2>Shareable URLs</h2>
          <p>
            The &quot;Share&quot; feature compresses your input into the URL fragment (the part after{' '}
            <span className="gs-page-kbd">#</span>) using lz-string. Fragments are not sent to servers by browsers —
            but anyone you send the link to can see the content.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Hosting</h2>
          <p>
            This site is served as static files. Standard server access logs may record your IP address and the URL path
            you requested — but never the URL fragment, so log content is not visible to the host.
          </p>
        </section>
      </div>
    </GlowShell>
  )
}
