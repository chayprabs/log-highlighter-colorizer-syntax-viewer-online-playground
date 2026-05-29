'use client'

import { useEffect } from 'react'

type KeyboardShortcutsOptions = {
  onFocusInput: () => void
  onLoadExample: () => void
  onClear: () => void
}

export function useKeyboardShortcuts({
  onFocusInput,
  onLoadExample,
  onClear,
}: KeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      const inInput = target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT'

      if (event.key === '/' && !inInput) {
        event.preventDefault()
        onFocusInput()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        onLoadExample()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFocusInput, onLoadExample, onClear])
}
