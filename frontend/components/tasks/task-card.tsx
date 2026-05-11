'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { setTaskCompleted, deleteTask } from '@/lib/actions/tasks'
import type { TaskRow } from '@/types/database'

interface Props {
  task: TaskRow
}

function getDueMeta(dueDate: string | null): {
  label: string
  color: string
  urgency: string
} {
  if (!dueDate) return { label: '', color: 'var(--muted-foreground)', urgency: 'none' }

  const daysLeft = Math.ceil(
    (new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
    86_400_000,
  )

  if (daysLeft < 0)
    return { label: `Overdue by ${Math.abs(daysLeft)}d`, color: '#ef4444', urgency: 'overdue' }
  if (daysLeft === 0)
    return { label: 'Due today', color: '#f97316', urgency: 'today' }
  if (daysLeft === 1)
    return { label: 'Due tomorrow', color: '#f97316', urgency: 'soon' }
  if (daysLeft <= 7)
    return { label: `${daysLeft} days left`, color: '#eab308', urgency: 'week' }
  return {
    label: `Due ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    color: 'var(--muted-foreground)',
    urgency: 'fine',
  }
}

export default function TaskCard({ task }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const due = getDueMeta(task.due_date)

  function handleToggle() {
    startTransition(() => setTaskCompleted(task.id, !task.is_completed))
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(() => deleteTask(task.id))
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        transition: 'box-shadow 0.15s',
        opacity: isPending ? 0.6 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Completion toggle */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        title={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: task.is_completed ? 'none' : '2px solid var(--border)',
          background: task.is_completed ? '#22c55e' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {task.is_completed ? '✓' : ''}
      </button>

      {/* Name + due */}
      <Link
        href={`/tasks/${task.id}`}
        style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
      >
        <p style={{
          margin: 0,
          fontWeight: 600,
          fontSize: 15,
          color: task.is_completed ? 'var(--muted-foreground)' : 'var(--foreground)',
          textDecoration: task.is_completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.name}
        </p>

        {due.label && (
          <p style={{
            margin: '3px 0 0',
            fontSize: 12,
            color: task.is_completed ? 'var(--muted-foreground)' : due.color,
            fontWeight: due.urgency === 'fine' || due.urgency === 'none' ? 400 : 600,
          }}>
            {due.label}
          </p>
        )}
      </Link>

      {/* Delete */}
      {confirmDelete ? (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          title="Delete task"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            fontSize: 20,
            lineHeight: 1,
            padding: '2px 6px',
            borderRadius: 6,
            opacity: 0.6,
            transition: 'opacity 0.1s, color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '0.6'
            e.currentTarget.style.color = 'var(--muted-foreground)'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
