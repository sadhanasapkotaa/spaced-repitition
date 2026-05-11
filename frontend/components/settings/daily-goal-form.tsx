'use client'

import { useState, useTransition } from 'react'
import { updateDailyGoal } from '@/lib/actions/settings'

interface Props {
  initial: number
}

const PRESETS = [10, 20, 30, 50]

export default function DailyGoalForm({ initial }: Props) {
  const [goal, setGoal] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await updateDailyGoal(goal)
        setEditing(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save.')
      }
    })
  }

  function handleCancel() {
    setGoal(initial)
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {initial} <span style={{ fontWeight: 500, color: 'var(--muted-foreground)' }}>cards/day</span>
        </p>
        <button
          onClick={() => setEditing(true)}
          style={ghostBtn}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="number"
          value={goal}
          onChange={e => setGoal(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
          min={1}
          max={500}
          autoFocus
          style={{
            width: 92,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: 16,
            fontWeight: 600,
            outline: 'none',
          }}
        />
        <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>cards/day</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setGoal(p)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: `1px solid ${goal === p ? 'var(--primary)' : 'var(--border)'}`,
              background: goal === p ? 'var(--primary)' : 'transparent',
              color: goal === p ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={isPending}
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
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button onClick={handleCancel} style={ghostBtn}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--foreground)',
}
