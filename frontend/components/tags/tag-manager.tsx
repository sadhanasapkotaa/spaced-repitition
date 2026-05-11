'use client'

import { useState, useTransition } from 'react'
import { createTag, deleteTag, renameTag } from '@/lib/actions/tags'
import type { TagWithCount } from '@/lib/queries/tags'

interface Props {
  tags: TagWithCount[]
}

export default function TagManager({ tags }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCreating, startCreate] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startCreate(async () => {
      try {
        await createTag(name.trim())
        setName('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create tag.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Create */}
      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="New tag name…"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            {isCreating ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}
      </form>

      {/* List */}
      {tags.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: 'var(--muted-foreground)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏷️</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            No tags yet. Create one above.
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {tags.map((tag, i) => (
            <TagRow
              key={tag.id}
              tag={tag}
              editing={editingId === tag.id}
              onStartEdit={() => setEditingId(tag.id)}
              onStopEdit={() => setEditingId(null)}
              isLast={i === tags.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TagRow({
  tag,
  editing,
  onStartEdit,
  onStopEdit,
  isLast,
}: {
  tag: TagWithCount
  editing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  isLast: boolean
}) {
  const [name, setName] = useState(tag.name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === tag.name) {
      onStopEdit()
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await renameTag(tag.id, name.trim())
        onStopEdit()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to rename.')
      }
    })
  }

  function handleDelete() {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from ${tag.card_count} card${tag.card_count !== 1 ? 's' : ''}.`)) return
    startTransition(() => deleteTag(tag.id))
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      opacity: isPending ? 0.6 : 1,
    }}>
      {editing ? (
        <form onSubmit={handleRename} style={{ flex: 1, display: 'flex', gap: 8 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={smallPrimaryBtn}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setName(tag.name); onStopEdit() }}
            style={smallGhostBtn}
          >
            Cancel
          </button>
          {error && <p style={{ margin: '0 0 0 8px', fontSize: 12, color: '#ef4444' }}>{error}</p>}
        </form>
      ) : (
        <>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--muted)',
            color: 'var(--foreground)',
            fontSize: 13,
            fontWeight: 600,
          }}>
            {tag.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flex: 1 }}>
            {tag.card_count} card{tag.card_count !== 1 ? 's' : ''}
          </span>
          <button onClick={onStartEdit} style={smallGhostBtn}>Rename</button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{ ...smallGhostBtn, color: '#ef4444', borderColor: 'transparent' }}
          >
            Delete
          </button>
        </>
      )}
    </div>
  )
}

const smallPrimaryBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const smallGhostBtn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--foreground)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
