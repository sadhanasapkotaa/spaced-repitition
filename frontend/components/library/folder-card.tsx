'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteFolder, updateFolder } from '@/lib/actions/folders'
import { updateCard } from '@/lib/actions/cards'
import { CARD_DRAG_MIME } from './card-item'
import type { FolderRow } from '@/types/database'

interface Props {
  folder: FolderRow
}

export default function FolderCard({ folder }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)
  const [dragOver, setDragOver] = useState(false)
  const [dropping, setDropping] = useState(false)

  function handleDelete() {
    if (!confirm(`Delete "${folder.name}" and all its cards?`)) return
    startTransition(() => deleteFolder(folder.id))
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === folder.name) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      await updateFolder(folder.id, name.trim())
      setEditing(false)
    })
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes(CARD_DRAG_MIME)) return
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes(CARD_DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // Only clear if the pointer truly left this element (not a child).
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const raw = e.dataTransfer.getData(CARD_DRAG_MIME)
    if (!raw) return
    e.preventDefault()
    setDragOver(false)

    let payload: { cardId: string; fromFolderId: string | null }
    try {
      payload = JSON.parse(raw)
    } catch {
      return
    }
    if (payload.fromFolderId === folder.id) return

    setDropping(true)
    startTransition(async () => {
      try {
        await updateCard(payload.cardId, payload.fromFolderId, { folder_id: folder.id })
      } finally {
        setDropping(false)
      }
    })
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="group relative rounded-lg border p-4 transition-all"
      style={{
        background: dragOver
          ? 'color-mix(in srgb, var(--primary) 10%, var(--card))'
          : 'var(--card)',
        borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
        borderWidth: dragOver ? 2 : 1,
        boxShadow: dragOver
          ? '0 6px 24px color-mix(in srgb, var(--primary) 28%, transparent)'
          : 'none',
        transform: dragOver ? 'scale(1.02)' : 'scale(1)',
        opacity: dropping ? 0.6 : 1,
      }}
      aria-dropeffect={dragOver ? 'move' : undefined}
    >
      {dragOver && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            pointerEvents: 'none',
          }}
        >
          DROP HERE
        </div>
      )}
      {editing ? (
        <form onSubmit={handleRename} className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setName(folder.name) }}
            className="text-xs text-zinc-500"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/library/${folder.id}`}
            className="min-w-0 flex-1 truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            {folder.name}
          </Link>
          <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Link
              href={`/library/${folder.id}/play`}
              title="Play this folder"
              aria-label={`Play ${folder.name}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30"
            >
              ▶
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Rename
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
