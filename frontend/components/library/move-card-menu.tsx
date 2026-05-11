'use client'

import { useState, useTransition } from 'react'
import { updateCard } from '@/lib/actions/cards'
import type { FolderRow } from '@/types/database'

interface Props {
  cardId: string
  currentFolderId: string | null
  folders: Pick<FolderRow, 'id' | 'name'>[]
}

export default function MoveCardMenu({ cardId, currentFolderId, folders }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function move(folderId: string | null) {
    if (folderId === currentFolderId) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      await updateCard(cardId, currentFolderId, { folder_id: folderId })
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--foreground)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Move to folder…
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 20,
        minWidth: 200,
        maxHeight: 240,
        overflowY: 'auto',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 4,
      }}>
        {folders.length === 0 ? (
          <p style={{
            margin: 0,
            padding: '10px 12px',
            fontSize: 13,
            color: 'var(--muted-foreground)',
          }}>
            No folders yet.
          </p>
        ) : (
          folders.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => move(f.id)}
              disabled={isPending}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 6,
                border: 'none',
                background: f.id === currentFolderId ? 'var(--muted)' : 'transparent',
                color: 'var(--foreground)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {f.name}
              {f.id === currentFolderId && (
                <span style={{ marginLeft: 6, color: 'var(--muted-foreground)' }}>✓</span>
              )}
            </button>
          ))
        )}
        {currentFolderId !== null && (
          <button
            type="button"
            onClick={() => move(null)}
            disabled={isPending}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 6,
              border: 'none',
              borderTop: '1px solid var(--border)',
              marginTop: 4,
              background: 'transparent',
              color: 'var(--muted-foreground)',
              fontSize: 12,
              fontStyle: 'italic',
              cursor: 'pointer',
            }}
          >
            Remove from folder
          </button>
        )}
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
        }}
      />
    </div>
  )
}
