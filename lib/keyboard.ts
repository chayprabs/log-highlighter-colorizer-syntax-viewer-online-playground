/**
 * Keyboard shortcut definitions and registration for the log highlighter.
 *
 * Design decisions:
 *   - Shortcuts are defined as a static config object, not scattered in components
 *   - Registration uses a single global keydown listener on document
 *   - Shortcuts use Ctrl on Windows/Linux and Cmd (metaKey) on Mac automatically
 *   - All shortcuts are documented in a SHORTCUTS constant for use in the help modal
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShortcutDefinition {
  /** Internal key used to identify this shortcut */
  id: string
  /** Human-readable label shown in the shortcut help panel */
  label: string
  /** The key to press (e.g. 'k', 'Enter', 'Escape') */
  key: string
  /** Whether Ctrl (Windows) / Cmd (Mac) must be held */
  ctrl?: boolean
  /** Whether Shift must be held */
  shift?: boolean
  /** Whether Alt must be held */
  alt?: boolean
  /** If true, shortcut fires even when focus is inside an input or textarea */
  allowInInput?: boolean
}

// ─── Shortcut Definitions ─────────────────────────────────────────────────────

/**
 * All keyboard shortcuts for the application.
 * This is the single source of truth — used for both registration and the help UI.
 */
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
  },
  {
    id: 'copy-output-html',
    label: 'Copy highlighted output as HTML',
    key: 'c',
    ctrl: true,
    shift: true,
  },
  {
    id: 'export-html',
    label: 'Export as HTML file',
    key: 'e',
    ctrl: true,
    shift: true,
  },
  {
    id: 'export-text',
    label: 'Export as plain text file',
    key: 't',
    ctrl: true,
    shift: true,
  },
  {
    id: 'share',
    label: 'Generate and copy share URL',
    key: 's',
    ctrl: true,
    shift: true,
  },
  {
    id: 'toggle-shortcuts',
    label: 'Show / hide keyboard shortcuts',
    key: '?',
    shift: true,
    allowInInput: false,
  },
  {
    id: 'dismiss',
    label: 'Dismiss modal / clear errors',
    key: 'Escape',
    allowInInput: true,
  },
]

// ─── Platform Detection ───────────────────────────────────────────────────────

/**
 * Returns true if the user is on macOS.
 * Used to show Cmd vs Ctrl in the shortcut help UI.
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/**
 * Returns the display string for the primary modifier key.
 * Shows ⌘ on Mac, Ctrl on Windows/Linux.
 */
export function getPrimaryModifier(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

/**
 * Formats a shortcut definition as a human-readable key combination string.
 *
 * @param shortcut - The shortcut definition to format
 * @returns e.g. "⌘ + Shift + K" or "Ctrl + Shift + K"
 */
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push(getPrimaryModifier())
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase())
  return parts.join(' + ')
}

// ─── Registration ─────────────────────────────────────────────────────────────

type ShortcutHandlers = Partial<Record<string, () => void>>

/**
 * Registers all keyboard shortcuts on the document.
 * Returns a cleanup function — call it in useEffect cleanup to remove listeners.
 *
 * @param handlers - Map of shortcut id to handler function
 * @returns Cleanup function to remove the event listener
 *
 * @example
 * useEffect(() => {
 *   return registerShortcuts({
 *     'clear-all': handleClear,
 *     'focus-input': () => inputRef.current?.focus(),
 *   })
 * }, [handleClear])
 */
export function registerShortcuts(handlers: ShortcutHandlers): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const isInInput =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement

    for (const shortcut of SHORTCUTS) {
      // Skip if key doesn't match
      if (event.key !== shortcut.key) continue

      // Skip if modifier requirements not met
      const needsCtrl = shortcut.ctrl ?? false
      const needsShift = shortcut.shift ?? false
      const needsAlt = shortcut.alt ?? false

      // On Mac, use metaKey for ctrl shortcuts
      const ctrlHeld = isMac() ? event.metaKey : event.ctrlKey

      if (needsCtrl && !ctrlHeld) continue
      if (!needsCtrl && ctrlHeld) continue
      if (needsShift && !event.shiftKey) continue
      if (needsAlt && !event.altKey) continue

      // Skip if inside input and shortcut doesn't allow it
      if (isInInput && !shortcut.allowInInput) continue

      // Check if handler exists for this shortcut
      const handler = handlers[shortcut.id]
      if (!handler) continue

      // Prevent browser defaults (e.g. Ctrl+S saving the page)
      event.preventDefault()
      handler()
      return
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}