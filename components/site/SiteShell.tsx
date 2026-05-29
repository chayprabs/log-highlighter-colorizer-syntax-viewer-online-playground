'use client'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

type SiteShellProps = {
  children: React.ReactNode
  showSeoBar?: boolean
  seoBar?: React.ReactNode
}

export function SiteShell({ children, showSeoBar = false, seoBar }: SiteShellProps): JSX.Element {
  return (
    <div className="site-shell">
      <SiteHeader />
      {showSeoBar ? seoBar : null}
      <div className="site-body">{children}</div>
      <SiteFooter />
    </div>
  )
}
