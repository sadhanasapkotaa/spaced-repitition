import Link from 'next/link'
import type { TaskChart } from '@/lib/queries/dashboard'

interface Props {
  tasks: TaskChart[]
}

const GREEN = '#22c55e'
const RED   = '#ef4444'

function* eachDay(start: string, end: string): Generator<string> {
  let cursor = start
  while (cursor <= end) {
    yield cursor
    const d = new Date(cursor + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 1)
    cursor = d.toISOString().slice(0, 10)
  }
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start + 'T00:00:00Z').getTime()
  const b = new Date(end   + 'T00:00:00Z').getTime()
  return Math.round((b - a) / 86_400_000) + 1
}

export default function TaskStreakChart({ tasks }: Props) {
  if (tasks.length === 0) return null

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Task consistency
        </h2>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted-foreground)' }}>
          <LegendDot color={GREEN} label="done" />
          <LegendDot color={RED}   label="missed" />
        </div>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </section>
  )
}

function TaskRow({ task }: { task: TaskChart }) {
  const total = daysBetween(task.start_date, task.end_date)
  const done  = task.completions.size

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 12,
      }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.name}
        </p>
        <p style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--muted-foreground)',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {task.streak > 0 && (
            <span style={{ color: GREEN, fontWeight: 700 }}>
              🔥 {task.streak}d ·{' '}
            </span>
          )}
          {done}/{total} days
        </p>
      </div>

      <DayBar task={task} />
    </Link>
  )
}

function DayBar({ task }: { task: TaskChart }) {
  const days: { date: string; done: boolean }[] = []
  for (const date of eachDay(task.start_date, task.end_date)) {
    days.push({ date, done: task.completions.has(date) })
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        height: 14,
        borderRadius: 4,
        overflow: 'hidden',
      }}
      role="img"
      aria-label={`${task.completions.size} of ${days.length} days completed`}
    >
      {days.map(d => (
        <div
          key={d.date}
          title={`${d.date} — ${d.done ? 'done' : 'missed'}`}
          style={{
            flex: 1,
            minWidth: 2,
            background: d.done ? GREEN : RED,
            opacity: d.done ? 1 : 0.55,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block',
      }} />
      {label}
    </span>
  )
}
