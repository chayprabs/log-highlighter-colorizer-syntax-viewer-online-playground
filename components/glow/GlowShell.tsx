'use client'

import { useEffect, useState } from 'react'
import { SiteShell } from '@/components/site/SiteShell'
import type { ThemeId } from '@/lib/glow-utils'
import { initialTheme } from '@/lib/glow-utils'

type GlowShellProps = {
  children: React.ReactNode
}

export function GlowShell({ children }: GlowShellProps): JSX.Element {
  const [theme] = useState<ThemeId>('light')

  useEffect(() => {
    initialTheme()
  }, [])

  return (
    <SiteShell>
      <div className="glow-shell gs-legal-shell" data-theme={theme}>
        <div className="gs-page">{children}</div>
      </div>
    </SiteShell>
  )
}
