'use client'

import { useEffect, useState } from 'react'
import { Footer } from '@/components/glow/Footer'
import { Toolbar } from '@/components/glow/Toolbar'
import type { FontSizeId, ThemeId } from '@/lib/glow-utils'
import { initialTheme } from '@/lib/glow-utils'

const MOBILE_BREAKPOINT = 640

type GlowShellProps = {
  children: React.ReactNode
}

export function GlowShell({ children }: GlowShellProps): JSX.Element {
  const [theme, setTheme] = useState<ThemeId>('light')
  const [mobile, setMobile] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    setTheme(initialTheme())
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = (): void => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const noopFont: FontSizeId = 'M'

  return (
    <div className="glow-shell" data-theme={theme}>
      <Toolbar
        theme={theme}
        onThemeToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        lineNumbers={true}
        onLineNumbersToggle={() => {}}
        wrap={false}
        onWrapToggle={() => {}}
        fontSize={noopFont}
        onFontSizeChange={() => {}}
        legendOpen={legendOpen}
        onLegendToggle={() => setLegendOpen(v => !v)}
        mobile={mobile}
      />
      <div className="gs-page">{children}</div>
      <Footer mobile={mobile} />
    </div>
  )
}
