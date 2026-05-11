'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deleteFolder, updateFolder } from '@/lib/actions/folders'
import type { FolderRow } from '@/types/database'

interface Props {
  folder: FolderRow
}

export default function FolderCard({ folder }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)

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

  return (
    <div className="group relative rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
