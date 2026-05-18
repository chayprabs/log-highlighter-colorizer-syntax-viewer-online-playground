import type { Metadata } from 'next'
import { GlowShell } from '@/components/glow/GlowShell'

export const metadata: Metadata = {
  title: 'Terms — Glow',
  description: 'Terms of use for the Glow log highlighter.',
}

export default function TermsPage(): JSX.Element {
  return (
    <GlowShell>
      <div className="gs-page-inner">
        <div className="gs-page-eyebrow">Terms</div>
        <h1 className="gs-page-title">Use it freely. No warranty.</h1>
        <p className="gs-page-lede">
          Glow is provided by Authos as a free tool, released under the MIT license. Use it for any purpose, including
          commercial.
        </p>

        <section className="gs-page-section">
          <h2>License</h2>
          <p>
            Glow&apos;s source is distributed under the MIT license. You may copy, modify, and redistribute it,
            including in proprietary software, provided the copyright and license notice are preserved.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>No warranty</h2>
          <p>
            The software is provided &quot;as is,&quot; without warranty of any kind, express or implied. We make no
            guarantees about correctness of token highlighting, completeness of detection, or fitness for any particular
            purpose.
          </p>
        </section>

        <section className="gs-page-section">
          <h2>Acceptable use</h2>
          <ul className="gs-page-list">
            <li>Don&apos;t use Glow to process content you aren&apos;t permitted to read.</li>
            <li>Don&apos;t attempt to abuse hosting resources (scripted bulk requests, etc).</li>
            <li>Don&apos;t republish Glow misrepresenting it as your own original work.</li>
          </ul>
        </section>

        <section className="gs-page-section">
          <h2>Changes</h2>
          <p>
            These terms may be revised. The current version always lives at <span className="gs-page-kbd">/terms</span>.
          </p>
        </section>
      </div>
    </GlowShell>
  )
}
