import { SITE } from '@/lib/site-config'

export function SeoBar(): JSX.Element {
  return (
    <div className="site-seo-bar" role="note" aria-label="Product description">
      <p className="site-seo-line">
        <strong>{SITE.name}</strong> — {SITE.tagline}.
      </p>
      <p className="site-seo-line site-seo-sub">{SITE.description}</p>
    </div>
  )
}
