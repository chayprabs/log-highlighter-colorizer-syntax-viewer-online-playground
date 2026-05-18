import type { Metadata } from 'next'
import { GlowShell } from '@/components/glow/GlowShell'

export const metadata: Metadata = {
  title: 'Credits — Glow',
  description: 'Credits and acknowledgements for Glow.',
}

export default function CreditsPage(): JSX.Element {
  return (
    <GlowShell>
      <div className="gs-page-inner">
        <div className="gs-page-eyebrow">Credits</div>
        <h1 className="gs-page-title">Built on open source.</h1>
        <p className="gs-page-lede">Glow is a thin layer over good libraries. Many thanks to the maintainers below.</p>

        <section className="gs-page-section" style={{ borderTop: 0, marginTop: 0, paddingTop: 0 }}>
          <div className="gs-page-credit">
            <div className="gs-page-credit-name">Next.js</div>
            <div className="gs-page-credit-body">
              The React framework that powers the site.{' '}
              <a className="gs-page-credit-link" href="https://nextjs.org">
                nextjs.org
              </a>
            </div>
          </div>
          <div className="gs-page-credit">
            <div className="gs-page-credit-name">lz-string</div>
            <div className="gs-page-credit-body">
              Compresses log content into shareable URL fragments.{' '}
              <a className="gs-page-credit-link" href="https://github.com/pieroxy/lz-string">
                github.com/pieroxy/lz-string
              </a>
            </div>
          </div>
          <div className="gs-page-credit">
            <div className="gs-page-credit-name">next-pwa</div>
            <div className="gs-page-credit-body">
              Service-worker glue so Glow works offline once visited.{' '}
              <a className="gs-page-credit-link" href="https://github.com/shadowwalker/next-pwa">
                github.com/shadowwalker/next-pwa
              </a>
            </div>
          </div>
          <div className="gs-page-credit">
            <div className="gs-page-credit-name">Plus Jakarta Sans</div>
            <div className="gs-page-credit-body">
              UI typeface by Tokotype.{' '}
              <a className="gs-page-credit-link" href="https://fonts.google.com/specimen/Plus+Jakarta+Sans">
                fonts.google.com
              </a>
            </div>
          </div>
          <div className="gs-page-credit">
            <div className="gs-page-credit-name">JetBrains Mono</div>
            <div className="gs-page-credit-body">
              Monospace face used for log content.{' '}
              <a className="gs-page-credit-link" href="https://www.jetbrains.com/lp/mono/">
                jetbrains.com/lp/mono
              </a>
            </div>
          </div>
        </section>
      </div>
    </GlowShell>
  )
}
