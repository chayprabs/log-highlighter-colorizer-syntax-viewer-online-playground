import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Credits — Glow',
  description: 'Open source acknowledgements for Glow.',
}

export default function CreditsPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
      <p className="mb-6">
        <Link href="/" className="text-cyan-600 underline dark:text-cyan-400">
          ← Back to Glow
        </Link>
      </p>
      <h1 className="mb-6 text-3xl font-bold">Credits</h1>
      <ul className="list-inside list-disc space-y-3 text-sm leading-relaxed">
        <li>
          URL compression:{' '}
          <a className="text-cyan-600 underline dark:text-cyan-400" href="https://github.com/pieroxy/lz-string">
            lz-string
          </a>{' '}
          (MIT)
        </li>
        <li>
          PWA:{' '}
          <a className="text-cyan-600 underline dark:text-cyan-400" href="https://github.com/shadowwalker/next-pwa">
            next-pwa
          </a>{' '}
          (MIT)
        </li>
        <li>
          Framework:{' '}
          <a className="text-cyan-600 underline dark:text-cyan-400" href="https://nextjs.org">
            Next.js
          </a>{' '}
          (MIT)
        </li>
      </ul>
    </div>
  )
}
