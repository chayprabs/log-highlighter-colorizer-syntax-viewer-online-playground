import type { Metadata } from 'next'
import { GlowShell } from '@/components/glow/GlowShell'
import { SITE } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Privacy Policy — Glow',
  description: 'Privacy notice for the Glow log highlighter.',
}

export default function PrivacyPage(): JSX.Element {
  return (
    <GlowShell>
      <div className="gs-page-inner">
        <div className="gs-page-eyebrow">Privacy Policy</div>
        <h1 className="gs-page-title">Your logs stay on your machine.</h1>
        <p className="gs-page-lede">
          Last updated: May 29, 2026. Glow is operated by {SITE.author}. This policy explains what data we collect
          (spoiler: essentially none from the app itself) and how the tool works.
        </p>

        <section className="gs-page-section">
          <h2>Data controller</h2>
          <p>
            {SITE.author} operates Glow. Contact:{' '}
            <a className="gs-page-credit-link" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            . Website:{' '}
            <a className="gs-page-credit-link" href={SITE.websiteUrl}>
              {SITE.websiteUrl}
            </a>
          </p>
        </section>

        <section className="gs-page-section">
          <h2>What we collect</h2>
          <p>
            Glow does not require an account. The application does not set cookies, does not include analytics or
            telemetry scripts, and does not send your log content to any application server for processing.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>What stays on your device</h2>
          <ul className="gs-page-list">
            <li>Text you paste, type, or drop into the input panel is processed locally in your browser.</li>
            <li>Syntax highlighting runs entirely in JavaScript on your device.</li>
            <li>Glow does not persist logs or settings to localStorage, sessionStorage, or IndexedDB.</li>
          </ul>
        </section>

        <section className="gs-page-section">
          <h2>Shareable URLs</h2>
          <p>
            The Share feature compresses your workspace (including log text and viewer settings) into the URL fragment
            (the part after <span className="gs-page-kbd">#</span>) using lz-string. URL fragments are not sent to
            servers in HTTP requests, but anyone you send the full URL to can decode the fragment. Shared links may
            also appear in browser history on your device.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Hosting and infrastructure</h2>
          <p>
            Glow is served as static files from a hosting provider (e.g. Vercel or Cloudflare). Standard server or CDN
            access logs may record your IP address, user agent, and the URL path requested — but not the URL fragment,
            so log content in shared links is not visible to the host from HTTP logs alone. Hosting providers may set
            short-lived infrastructure cookies for load balancing or security; those are outside Glow&apos;s control.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Children</h2>
          <p>Glow is a developer tool not directed at children under 13. We do not knowingly collect personal data.</p>
        </section>

        <section className="gs-page-section">
          <h2>Your rights</h2>
          <p>
            Because Glow does not collect personal data through the app, there is typically nothing for us to access,
            correct, or delete on your behalf. If you have privacy questions, contact us at {SITE.contactEmail}.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Changes</h2>
          <p>
            We may update this policy. The current version is always at <span className="gs-page-kbd">/privacy</span>.
          </p>
        </section>
      </div>
    </GlowShell>
  )
}
