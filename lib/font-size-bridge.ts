import type { FontSizeId as GlowFontSizeId } from '@/lib/glow-utils'
import type { FontSizeId as UrlFontSizeId } from '@/lib/urlState'

export function glowFontToUrl(size: GlowFontSizeId): UrlFontSizeId {
  if (size === 'S') return 'small'
  if (size === 'L') return 'large'
  return 'medium'
}

export function urlFontToGlow(size: UrlFontSizeId): GlowFontSizeId {
  if (size === 'small') return 'S'
  if (size === 'large') return 'L'
  return 'M'
}
