export interface ShortcutDefinition {
  id: string
  label: string
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  allowInInput?: boolean
}

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'focus-input',
    label: 'Focus input',
    key: 'k',
    ctrl: true,
  },
  {
    id: 'clear-all',
    label: 'Clear input and output',
    key: 'Backspace',
    ctrl: true,
    shift: true,
    allowInInput: true,
  },
  {
    id: 'copy-output-html',
    label: 'Copy highlighted output as HTML',
    key: 'c',
    ctrl: true,
    shift: true,
    allowInInput: true,
  },
  {
    id: 'export-html',
    label: 'Export as HTML file',
    key: 'e',
    ctrl: true,
    shift: true,
    allowInInput: true,
  },
  {
    id: 'export-text',
    label: 'Export as plain text file',
    key: 't',
    ctrl: true,
    shift: true,
    allowInInput: true,
  },
  {
    id: 'share',
    label: 'Generate and copy share URL',
    key: 's',
    ctrl: true,
    allowInInput: true,
  },
  {
    id: 'toggle-shortcuts',
    label: 'Show or hide keyboard shortcuts',
    key: '?',
    shift: true,
  },
  {
    id: 'dismiss',
    label: 'Dismiss modal or clear status',
    key: 'Escape',
    allowInInput: true,
  },
]

type ShortcutHandlers = Partial<Record<ShortcutDefinition['id'], () => void>>

export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

export function getPrimaryModifier(): string {
  return isMac() ? 'Cmd' : 'Ctrl'
}

export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = []

  if (shortcut.ctrl) {
    parts.push(getPrimaryModifier())
  }
  if (shortcut.shift) {
    parts.push('Shift')
  }
  if (shortcut.alt) {
    parts.push('Alt')
  }

  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
  return parts.join(' + ')
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
  const primaryPressed = isMac() ? event.metaKey : event.ctrlKey
  const secondaryPrimaryPressed = isMac() ? event.ctrlKey : event.metaKey

  if ((shortcut.ctrl ?? false) !== primaryPressed) {
    return false
  }

  if (secondaryPrimaryPressed) {
    return false
  }

  if ((shortcut.shift ?? false) !== event.shiftKey) {
    return false
  }

  if ((shortcut.alt ?? false) !== event.altKey) {
    return false
  }

  return event.key === shortcut.key
}

export function registerShortcuts(handlers: ShortcutHandlers): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target
    const inInput =
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable)

    for (const shortcut of SHORTCUTS) {
      if (!matchesShortcut(event, shortcut)) {
        continue
      }

      if (inInput && !shortcut.allowInInput) {
        continue
      }

      const handler = handlers[shortcut.id]
      if (!handler) {
        continue
      }

      event.preventDefault()
      handler()
      return
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}
