export function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10240 ? 1 : 0)} KB`
  return `${(b / (1024 * 1024)).toFixed(2)} MB`
}

export function fmtInt(n: number): string {
  return n.toLocaleString()
}

export type ThemeId = 'light' | 'dark'
export type FontSizeId = 'S' | 'M' | 'L'

export const MAX_INPUT_BYTES = 10 * 1024 * 1024
export const WARN_INPUT_BYTES = 1024 * 1024

export function initialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
