'use client'

import { useState, useTransition } from 'react'
import { createCard } from '@/lib/actions/cards'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

interface Props {
  folderId: string
}

export default function CardForm({ folderId }: Props) {
  const [open, setOpen] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFront('')
    setBack('')
    setHint('')
    setColor(null)
    setError(null)
    setOpen(false)
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
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Add Card
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-zinc-200 bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <textarea
        value={front}
        onChange={e => setFront(e.target.value)}
        placeholder="Front"
        rows={2}
        required
        autoFocus
        className="w-full resize-none rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <textarea
        value={back}
        onChange={e => setBack(e.target.value)}
        placeholder="Back"
        rows={2}
        required
        className="w-full resize-none rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <input
        value={hint}
        onChange={e => setHint(e.target.value)}
        placeholder="Hint (optional)"
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {/* Color picker */}
      <div>
        <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">Card color</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setColor(null)}
            title="No color"
            className={`h-6 w-6 rounded-full border-2 bg-zinc-200 dark:bg-zinc-700 ${
              !color ? 'border-zinc-900 dark:border-zinc-100' : 'border-transparent'
            }`}
          />
          {PRESET_COLORS.map(c => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              title={c}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c ? 'border-zinc-900 dark:border-zinc-100' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !front.trim() || !back.trim()}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? 'Creating…' : 'Create Card'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
