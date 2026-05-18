import Link from 'next/link'
import { Icon } from '@/components/glow/Icons'

type FooterProps = {
  mobile: boolean
}

export function Footer({ mobile }: FooterProps): JSX.Element {
  return (
    <footer className="gs-footer">
      <div className="gs-foot-priv">
        <span className="gs-foot-lock">{Icon.lock}</span>
        <span>
          {mobile
            ? 'Nothing leaves your browser.'
            : 'Nothing leaves your browser. Log content is processed locally. No data sent to any server.'}
        </span>
      </div>
      <div className="gs-foot-meta">
        <span>© 2026 Authos</span>
        <span className="gs-foot-meta-dot">·</span>
        <Link className="gs-foot-link" href="/privacy">
          Privacy
        </Link>
        <Link className="gs-foot-link" href="/terms">
          Terms
        </Link>
        <Link className="gs-foot-link" href="/credits">
          Credits
        </Link>
      </div>
    </footer>
  )
}
