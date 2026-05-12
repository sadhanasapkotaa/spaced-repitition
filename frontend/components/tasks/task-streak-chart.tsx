import Link from 'next/link'
import type { TaskChart } from '@/lib/queries/dashboard'
import { TaskRatioBar, taskBarColors } from './task-ratio-bar'

interface Props {
  tasks: TaskChart[]
}

export default function TaskStreakChart({ tasks }: Props) {
  if (tasks.length === 0) return null

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Task consistency
        </h2>
        <Legend />
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        {tasks.map(t => (
          <Row key={t.id} task={t} />
        ))}
      </div>
    </section>
  )
}

function Row({ task }: { task: TaskChart }) {
  const pct = task.totalDays > 0 ? Math.round((task.doneDays / task.totalDays) * 100) : 0

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 7,
      }}>
        <p style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--foreground)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.name}
        </p>
        <p style={{
          margin: 0,
          fontSize: 12,
          color: 'var(--muted-foreground)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {task.doneDays}/{task.totalDays} · {pct}%
        </p>
      </div>
      <TaskRatioBar doneDays={task.doneDays} totalDays={task.totalDays} />
    </Link>
  )
}

function Legend() {
  const { done, missed } = taskBarColors
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      fontSize: 10.5,
      color: 'var(--muted-foreground)',
      letterSpacing: '0.02em',
    }}>
      <Swatch color={done}   label="done" />
      <Swatch color={missed} label="missed" />
    </div>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </span>
  )
}
