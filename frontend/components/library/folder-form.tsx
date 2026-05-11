'use client'

import { useState, useTransition } from 'react'
import { createFolder } from '@/lib/actions/folders'

interface Props {
  parentId?: string
}

export default function FolderForm({ parentId }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await createFolder(name.trim(), parentId)
        setName('')
        setOpen(false)
      } catch {
        setError('Failed to create folder.')
      }
    })
  }

  const label = parentId ? 'New subfolder' : 'New folder'
  const placeholder = parentId ? 'Subfolder name' : 'Folder name'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 16px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        + {label}
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
    >
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--background)',
          color: 'var(--foreground)',
          fontSize: 14,
          outline: 'none',
          minWidth: 180,
        }}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          opacity: isPending || !name.trim() ? 0.55 : 1,
        }}
      >
        {isPending ? 'Creating…' : 'Create'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName(''); setError(null) }}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--foreground)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}
    </form>
  )
}
