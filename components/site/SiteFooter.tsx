import Link from 'next/link'

export function SiteFooter(): JSX.Element {
  return (
    <footer className="site-footer">
      <nav className="site-footer-nav" aria-label="Legal">
        <Link className="site-footer-link" href="/privacy">
          Privacy Policy
        </Link>
        <span className="site-footer-dot" aria-hidden>
          ·
        </span>
        <Link className="site-footer-link" href="/terms">
          Terms &amp; Conditions
        </Link>
      </nav>
      <span className="site-footer-copy">© 2026 Chaitanya Prabuddha</span>
    </footer>
  )
}
