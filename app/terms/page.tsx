import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms — Glow',
  description: 'Terms of service and terms of use for the Glow log highlighter.',
}

export default function TermsPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <p className="mb-6">
        <Link href="/" className="text-cyan-600 underline dark:text-cyan-400">
          ← Back to Glow
        </Link>
      </p>
      <h1 className="mb-6 text-3xl font-bold">Terms of service</h1>

      <section id="terms-of-use" className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Terms of use</h2>
        <p>
          By using Glow you agree to these terms of use and the sections below. Glow is a client-side tool; you remain
          responsible for how you use it and for any content you share via links.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Use at your own risk</h2>
        <p>
          Glow is provided free of charge and as-is, without warranty of any kind, under the MIT License. You use it at
          your own risk.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">No warranty on highlighting</h2>
        <p>
          Token patterns are regex-based and may not match all formats correctly. The operator makes no warranty that
          highlighted output is accurate or complete.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Acceptable use</h2>
        <p>You may not use Glow to process log content in a manner that violates applicable laws.</p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Shared links</h2>
        <p>
          When you use the share link feature, your log content is encoded in the URL. You are responsible for the content
          of links you share. The operator is not responsible for log content shared via URLs.
        </p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Open source</h2>
        <p>Glow&apos;s source code is available under the MIT License.</p>
      </section>

      <section className="mb-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">Changes</h2>
        <p>These terms may be updated at any time. Continued use constitutes acceptance.</p>
      </section>

      <p className="text-xs text-neutral-500">Last updated: May 17, 2026</p>
    </div>
  )
}
