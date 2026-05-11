'use client'

import { useState, useTransition } from 'react'
import { createTask } from '@/lib/actions/tasks'

export default function TaskForm() {
  const [open,      setOpen]      = useState(false)
  const [name,      setName]      = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate,   setDueDate]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setName('')
    setStartDate('')
    setDueDate('')
    setError(null)
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await createTask({
          name:       name.trim(),
          start_date: startDate || undefined,
          due_date:   dueDate   || undefined,
        })
        reset()
      } catch {
        setError('Failed to create task.')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        + New Task
      </button>
    )
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) reset() }}
    >
      <div style={{
        background: 'var(--card)',
        borderRadius: 22,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>New Task</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Task name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chapter 4 vocabulary"
              autoFocus
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 11,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                opacity: isPending || !name.trim() ? 0.55 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {isPending ? 'Creating…' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '13px 20px',
                borderRadius: 11,
                border: '1px solid var(--border)',
                background: 'transparent',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                color: 'var(--foreground)',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted-foreground)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}
