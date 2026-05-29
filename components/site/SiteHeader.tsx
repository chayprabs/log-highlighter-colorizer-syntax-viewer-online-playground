import Link from 'next/link'
import { Icon } from '@/components/site/Icons'
import { SITE } from '@/lib/site-config'

export function SiteHeader(): JSX.Element {
  return (
    <header className="site-header">
      <Link href="/" className="site-brand" aria-label={`${SITE.name} home`}>
        <span className="site-mark">{Icon.glow}</span>
        <span className="site-wordmark">{SITE.name}</span>
      </Link>
      <nav className="site-nav" aria-label="External links">
        <a
          className="site-nav-link"
          href={SITE.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          title="GitHub"
        >
          {Icon.github}
        </a>
        <a
          className="site-nav-link"
          href={SITE.twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter / X"
          title="Twitter"
        >
          {Icon.twitter}
        </a>
        <a
          className="site-nav-link"
          href={SITE.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Personal website"
          title="Website"
        >
          {Icon.globe}
        </a>
      </nav>
    </header>
  )
}
