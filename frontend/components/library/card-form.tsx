'use client'

import { useState, useTransition } from 'react'
import { createCard } from '@/lib/actions/cards'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

interface SimpleTag {
  id: string
  name: string
}

interface Props {
  folderId: string
  allTags?: SimpleTag[]
}

export default function CardForm({ folderId, allTags }: Props) {
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFront('')
    setBack('')
    setHint('')
    setColor(null)
    setSelectedTags(new Set())
    setError(null)
    setOpen(false)
  }

  function toggleTag(id: string) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await createCard({
          folder_id: folderId,
          front: front.trim(),
          back: back.trim(),
          hint: hint.trim() || undefined,
          color: color ?? undefined,
          tag_ids: selectedTags.size > 0 ? Array.from(selectedTags) : undefined,
        })
        reset()
      } catch {
        setError('Failed to create card.')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        + Add Card
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 16,
        background: color
          ? `color-mix(in srgb, ${color} 14%, var(--card))`
          : 'var(--card)',
        border: `1px solid ${color
          ? `color-mix(in srgb, ${color} 35%, var(--border))`
          : 'var(--border)'}`,
        borderRadius: 12,
        borderLeft: color ? `4px solid ${color}` : '1px solid var(--border)',
      }}
    >
      <textarea
        value={front}
        onChange={e => setFront(e.target.value)}
        placeholder="Front"
        rows={2}
        required
        autoFocus
        style={inputStyle}
      />
      <textarea
        value={back}
        onChange={e => setBack(e.target.value)}
        placeholder="Back"
        rows={2}
        required
        style={inputStyle}
      />
      <input
        value={hint}
        onChange={e => setHint(e.target.value)}
        placeholder="Hint (optional)"
        style={{ ...inputStyle, resize: 'none' }}
      />

      <div>
        <p style={overlineStyle}>Color</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <ColorSwatch
            color={null}
            selected={!color}
            onClick={() => setColor(null)}
          />
          {PRESET_COLORS.map(c => (
            <ColorSwatch
              key={c}
              color={c}
              selected={color === c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {allTags && (
        <div>
          <p style={overlineStyle}>Tags</p>
          {allTags.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>
              No tags yet. Create some on the Tags page.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allTags.map(t => {
                const checked = selectedTags.has(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                      background: checked ? 'var(--primary)' : 'transparent',
                      color: checked ? 'var(--primary-foreground)' : 'var(--foreground)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          type="submit"
          disabled={isPending || !front.trim() || !back.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Creating…' : 'Create Card'}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '8px 14px',
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
      </div>
    </form>
  )
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string | null
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color ?? 'None'}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `2px solid ${selected ? 'var(--foreground)' : 'transparent'}`,
        background: color ?? 'var(--muted)',
        cursor: 'pointer',
        padding: 0,
      }}
    />
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 14,
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
}

const overlineStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
}
