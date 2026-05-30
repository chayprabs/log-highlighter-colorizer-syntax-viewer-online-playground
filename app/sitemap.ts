import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.siteUrl.replace(/\/$/, '')
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/credits`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
