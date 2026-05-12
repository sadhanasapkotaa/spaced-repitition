'use client'

import { useState, useTransition } from 'react'
import { deleteCard, flagCard } from '@/lib/actions/cards'
import CardEditor, { type SimpleTag } from './card-editor'
import type { CardRow } from '@/types/database'

interface Props {
  card: CardRow & {
    card_tags?: { tag_id: string; tags: SimpleTag | null }[]
  }
  allTags?: SimpleTag[]
}

export const CARD_DRAG_MIME = 'application/x-monk-card'

export default function CardItem({ card, allTags }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [isPending, startTransition] = useTransition()

  const tags = card.card_tags?.flatMap(ct => ct.tags ? [ct.tags] : []) ?? []

  function handleFlag(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(() => flagCard(card.id, card.folder_id, !card.is_flagged))
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this card?')) return
    startTransition(() => deleteCard(card.id, card.folder_id))
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditing(true)
  }

  if (editing) {
    return (
      <CardEditor
        card={card}
        allTags={allTags}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    )
  }

  const tintedBg = card.color
    ? `color-mix(in srgb, ${card.color} 14%, var(--card))`
    : 'var(--card)'
  const borderColor = card.color
    ? `color-mix(in srgb, ${card.color} 35%, var(--border))`
    : 'var(--border)'

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    const payload = JSON.stringify({
      cardId: card.id,
      fromFolderId: card.folder_id,
    })
    e.dataTransfer.setData(CARD_DRAG_MIME, payload)
    e.dataTransfer.setData('text/plain', card.front)
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }

  function handleDragEnd() {
    setDragging(false)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => setFlipped(f => !f)}
      onKeyDown={e => e.key === 'Enter' && setFlipped(f => !f)}
      style={{
        background: tintedBg,
        border: `1px solid ${borderColor}`,
        borderLeftWidth: card.color ? 4 : 1,
        borderLeftColor: card.color ?? 'var(--border)',
        borderRadius: 12,
        padding: '16px 18px',
        cursor: dragging ? 'grabbing' : 'pointer',
        opacity: dragging ? 0.4 : 1,
        transition: 'box-shadow 0.15s, opacity 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      className="group"
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>
          {card.review_count === 0 ? 'NEW' : `${card.repeat_interval}d INTERVAL`}
        </span>
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <IconBtn
            onClick={handleFlag}
            title={card.is_flagged ? 'Unflag' : 'Flag for review'}
            color={card.is_flagged ? '#eab308' : undefined}
            disabled={isPending}
          >
            {card.is_flagged ? '⚑' : '⚐'}
          </IconBtn>
          <IconBtn onClick={handleEdit} title="Edit card" disabled={isPending}>
            ✎
          </IconBtn>
          <IconBtn
            onClick={handleDelete}
            title="Delete card"
            color="#ef4444"
            disabled={isPending}
          >
            ×
          </IconBtn>
        </div>
      </div>

      <p style={{
        margin: 0,
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--foreground)',
        lineHeight: 1.5,
      }}>
        {flipped ? card.back : card.front}
      </p>

      {flipped && card.hint && (
        <p style={{
          margin: '8px 0 0',
          fontSize: 13,
          color: 'var(--muted-foreground)',
          fontStyle: 'italic',
        }}>
          💡 {card.hint}
        </p>
      )}

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {tags.map(tag => (
            <span
              key={tag.id}
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <p style={{
        margin: '10px 0 0',
        fontSize: 10,
        color: 'var(--muted-foreground)',
        letterSpacing: '0.04em',
      }}>
        {flipped ? 'BACK' : 'FRONT'} · tap to flip
      </p>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  color,
  disabled,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title: string
  color?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: color ?? 'var(--muted-foreground)',
        cursor: 'pointer',
        fontSize: 16,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}
