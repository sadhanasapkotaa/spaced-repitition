'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignFoldersToTask, setTaskCompleted } from '@/lib/actions/tasks'
import { startSession } from '@/lib/actions/review'
import type { TaskRow, TaskProgress, FolderRow } from '@/types/database'

interface Props {
  task: TaskRow
  progress: TaskProgress | null
  assignedFolderIds: string[]
  allFolders: Pick<FolderRow, 'id' | 'name'>[]
}

export default function TaskDetail({ task, progress, assignedFolderIds, allFolders }: Props) {
  const router = useRouter()
  const [selected,    setSelected]    = useState<Set<string>>(new Set(assignedFolderIds))
  const [editFolders, setEditFolders] = useState(false)
  const [saving,      setSaving]      = useTransition()
  const [toggling,    startToggle]    = useTransition()
  const [starting,    setStarting]    = useState(false)

  const daysLeft = task.due_date
    ? Math.ceil(
        (new Date(task.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
        86_400_000,
      )
    : null

  const passRate =
    progress && progress.total_reviews > 0
      ? Math.round((progress.passed_reviews / progress.total_reviews) * 100)
      : null

  function toggleFolder(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSaveFolders() {
    setSaving(async () => {
      await assignFoldersToTask(task.id, Array.from(selected))
      setEditFolders(false)
    })
  }

  function handleCancelFolders() {
    setSelected(new Set(assignedFolderIds))
    setEditFolders(false)
  }

  async function handleStartReview() {
    setStarting(true)
    try {
      const sessionId = await startSession(task.id)
      router.push(`/review/${sessionId}?taskId=${task.id}`)
    } catch {
      setStarting(false)
    }
  }

  const dueMeta = (() => {
    if (daysLeft === null) return null
    if (daysLeft < 0)   return { text: `${Math.abs(daysLeft)}d overdue`, color: '#ef4444' }
    if (daysLeft === 0) return { text: 'Due today',    color: '#f97316' }
    if (daysLeft <= 3)  return { text: `${daysLeft}d left`, color: '#f97316' }
    if (daysLeft <= 7)  return { text: `${daysLeft}d left`, color: '#eab308' }
    return { text: `${daysLeft}d left`, color: 'var(--muted-foreground)' }
  })()

  const canReview = selected.size > 0 && !task.is_completed

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 16px 80px' }}>

      {/* Back link */}
      <a
        href="/tasks"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--muted-foreground)',
          textDecoration: 'none',
          marginBottom: 28,
        }}
      >
        ← Tasks
      </a>

      {/* Header */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '28px 28px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 8px',
              color: 'var(--foreground)',
              wordBreak: 'break-word',
            }}>
              {task.name}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {task.start_date && (
                <span style={chipStyle}>
                  📅 Start: {fmt(task.start_date)}
                </span>
              )}
              {task.due_date && (
                <span style={{
                  ...chipStyle,
                  background: dueMeta ? dueMeta.color + '18' : undefined,
                  color: dueMeta?.color,
                  borderColor: dueMeta ? dueMeta.color + '40' : undefined,
                  fontWeight: 600,
                }}>
                  🏁 {fmt(task.due_date)} {dueMeta && `· ${dueMeta.text}`}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => startToggle(() => setTaskCompleted(task.id, !task.is_completed))}
            disabled={toggling}
            style={{
              flexShrink: 0,
              padding: '9px 18px',
              borderRadius: 10,
              border: task.is_completed ? 'none' : '1px solid var(--border)',
              background: task.is_completed ? '#22c55e' : 'transparent',
              color: task.is_completed ? '#fff' : 'var(--foreground)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {task.is_completed ? '✓ Completed' : 'Mark complete'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {progress && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}>
          <StatTile
            label="Total cards"
            value={progress.total_cards}
          />
          <StatTile
            label="Due today"
            value={progress.due_cards}
            highlight={progress.due_cards > 0}
            highlightColor="#f97316"
          />
          <StatTile
            label="Pass rate"
            value={passRate !== null ? `${passRate}%` : '—'}
            highlight={passRate !== null && passRate >= 80}
            highlightColor="#22c55e"
          />
        </div>
      )}

      {progress && progress.total_reviews > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '18px 24px',
          marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
            Review history
          </p>
          <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              flex: progress.passed_reviews,
              background: '#22c55e',
              borderRadius: '6px 0 0 6px',
              minWidth: progress.passed_reviews > 0 ? 4 : 0,
            }} />
            <div style={{
              flex: progress.hard_reviews,
              background: '#f59e0b',
              minWidth: progress.hard_reviews > 0 ? 4 : 0,
            }} />
            <div style={{
              flex: progress.failed_reviews,
              background: '#ef4444',
              borderRadius: '0 6px 6px 0',
              minWidth: progress.failed_reviews > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <LegendDot color="#22c55e" label={`${progress.passed_reviews} passed`} />
            <LegendDot color="#f59e0b" label={`${progress.hard_reviews} tricky`} />
            <LegendDot color="#ef4444" label={`${progress.failed_reviews} missed`} />
          </div>
        </div>
      )}

      {/* Start review CTA */}
      <button
        onClick={handleStartReview}
        disabled={!canReview || starting}
        style={{
          width: '100%',
          padding: '17px 0',
          borderRadius: 16,
          border: 'none',
          background: canReview ? 'var(--primary)' : 'var(--muted)',
          color: canReview ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          fontWeight: 700,
          fontSize: 16,
          cursor: canReview ? 'pointer' : 'not-allowed',
          marginBottom: 32,
          transition: 'opacity 0.15s',
          opacity: starting ? 0.7 : 1,
        }}
      >
        {starting
          ? 'Starting…'
          : !canReview && selected.size === 0
          ? 'Assign folders to study'
          : task.is_completed
          ? 'Task completed'
          : progress?.due_cards
          ? `Study now · ${progress.due_cards} due`
          : 'Start Review'}
      </button>

      {/* Folder assignment */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>Linked Folders</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>
              Cards from these folders are included in this task's review queue
            </p>
          </div>
          {!editFolders ? (
            <button onClick={() => setEditFolders(true)} style={ghostBtn}>
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveFolders}
                disabled={saving}
                style={{
                  ...ghostBtn,
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={handleCancelFolders} style={ghostBtn}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {allFolders.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, margin: 0 }}>
            No folders in your library yet.{' '}
            <a href="/library" style={{ color: 'var(--primary)' }}>Create one →</a>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allFolders.map(folder => {
              const checked = selected.has(folder.id)
              return (
                <div
                  key={folder.id}
                  onClick={() => editFolders && toggleFolder(folder.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 11,
                    border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                    background: checked ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    cursor: editFolders ? 'pointer' : 'default',
                    transition: 'border-color 0.12s, background 0.12s',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `2px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                    background: checked ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: '#fff',
                    fontWeight: 700,
                    transition: 'background 0.12s, border-color 0.12s',
                  }}>
                    {checked ? '✓' : ''}
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: checked ? 600 : 400,
                    color: 'var(--foreground)',
                  }}>
                    {folder.name}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  highlight,
  highlightColor = '#22c55e',
}: {
  label: string
  value: string | number
  highlight?: boolean
  highlightColor?: string
}) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '16px 14px',
      textAlign: 'center',
    }}>
      <p style={{
        margin: '0 0 4px',
        fontSize: 26,
        fontWeight: 800,
        color: highlight ? highlightColor : 'var(--foreground)',
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}>
        {label}
      </p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  background: 'var(--muted)',
  border: '1px solid var(--border)',
  color: 'var(--muted-foreground)',
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
