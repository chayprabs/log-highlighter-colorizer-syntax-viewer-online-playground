import type { Metadata } from 'next'
import { GlowShell } from '@/components/glow/GlowShell'
import { SITE } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Glow',
  description: 'Terms of use for the Glow log highlighter.',
}

export default function TermsPage(): JSX.Element {
  return (
    <GlowShell>
      <div className="gs-page-inner">
        <div className="gs-page-eyebrow">Terms &amp; Conditions</div>
        <h1 className="gs-page-title">Use it freely. No warranty.</h1>
        <p className="gs-page-lede">
          Last updated: May 29, 2026. Glow is a free browser tool operated by {SITE.author}. By using Glow you agree
          to these terms.
        </p>

        <section className="gs-page-section">
          <h2>License</h2>
          <p>
            Glow&apos;s source code is distributed under the MIT License. You may copy, modify, merge, publish,
            distribute, sublicense, and/or sell copies of the software, provided the copyright notice and permission
            notice are included in all copies or substantial portions.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Disclaimer of warranty</h2>
          <p>
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
            NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. We
            make no guarantees about the correctness of syntax highlighting, completeness of token detection, or
            suitability for any particular purpose, including production incident response or compliance auditing.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {SITE.author.toUpperCase()} OR
            CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
            LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF OR INABILITY TO USE
            GLOW, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO
            GLOW SHALL NOT EXCEED USD $100.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Acceptable use</h2>
          <ul className="gs-page-list">
            <li>Do not use Glow to process content you are not authorized to access.</li>
            <li>Do not attempt to disrupt hosting infrastructure (automated bulk requests, denial-of-service, etc.).</li>
            <li>Do not misrepresent Glow as your own original work when redistributing modified versions.</li>
            <li>You are solely responsible for log data you paste, share via URL, or download.</li>
          </ul>
        </section>

        <section className="gs-page-section">
          <h2>Shared links</h2>
          <p>
            When you use the Share feature, log content is encoded in the URL fragment. Anyone with the full URL can
            decode and read that content. You are responsible for what you share and with whom.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of India, without regard to conflict-of-law principles. Any dispute
            shall be subject to the exclusive jurisdiction of courts located in India, unless mandatory consumer
            protection laws in your jurisdiction require otherwise.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Changes</h2>
          <p>
            We may update these terms at any time. The current version is always published at{' '}
            <span className="gs-page-kbd">/terms</span>. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a className="gs-page-credit-link" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
          </p>
        </section>
      </div>
    </GlowShell>
  )
}
