'use client'

/**
 * Keyboard shortcuts reference modal.
 * Displayed when the user presses Shift+? or clicks the shortcuts button.
 */

import { SHORTCUTS, formatShortcut } from '@/lib/keyboard'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 50,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#161616',
          border: '1px solid #2e2e2e',
          borderRadius: '10px',
          padding: '24px',
          zIndex: 51,
          minWidth: '360px',
          maxWidth: '480px',
          width: '90vw',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: 'bold' }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {SHORTCUTS.map((shortcut) => (
              <tr
                key={shortcut.id}
                style={{ borderBottom: '1px solid #1e1e1e' }}
              >
                <td style={{ padding: '10px 0', color: '#aaa', fontSize: '12px' }}>
                  {shortcut.label}
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>
                  <kbd
                    style={{
                      background: '#222',
                      border: '1px solid #3a3a3a',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#e0e0e0',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatShortcut(shortcut)}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: '16px', fontSize: '11px', color: '#555', textAlign: 'center' }}>
          Press Shift+? to toggle this panel
        </p>
      </div>
    </>
  )
}