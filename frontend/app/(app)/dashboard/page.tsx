import Link from 'next/link'
import { getAppUser } from '@/utils/supabase/auth'
import { getDashboardData } from '@/lib/queries/dashboard'
import TaskStreakChart from '@/components/tasks/task-streak-chart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [appUser, data] = await Promise.all([
    getAppUser(),
    getDashboardData(),
  ])

  const goalPct = Math.min(100, Math.round((data.reviewedToday / data.dailyGoal) * 100))
  const goalComplete = data.reviewedToday >= data.dailyGoal

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          margin: '0 0 4px',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--muted-foreground)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {greeting()}
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {appUser?.username || appUser?.email?.split('@')[0] || 'there'}
        </h1>
      </div>

      {/* Daily goal progress */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={overlineStyle}>Daily goal</p>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>
              {data.reviewedToday}
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 600, fontSize: 16 }}>
                {' '}/ {data.dailyGoal}
              </span>
            </p>
          </div>
          {goalComplete && (
            <span style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: 'color-mix(in srgb, #22c55e 18%, transparent)',
              color: '#16a34a',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>
              ✓ DONE
            </span>
          )}
        </div>
        <div style={{
          height: 10,
          background: 'var(--muted)',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${goalPct}%`,
            background: goalComplete ? '#22c55e' : 'var(--primary)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }} />
        </div>
        {!goalComplete && data.dueCount > 0 && (
          <Link
            href="/review"
            style={{
              display: 'inline-block',
              marginTop: 14,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            Start reviewing →
          </Link>
        )}
      </section>

      {/* Stat tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginTop: 16,
      }}>
        <Stat label="Due now" value={data.dueCount} accent={data.dueCount > 0 ? '#f97316' : undefined} />
        <Stat label="Streak" value={data.currentStreak} suffix={data.currentStreak === 1 ? 'day' : 'days'} accent={data.currentStreak > 0 ? '#22c55e' : undefined} />
        <Stat label="Best streak" value={data.longestStreak} suffix="days" />
      </div>

      {/* Active tasks */}
      <section style={{ marginTop: 28 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>
            Active tasks
          </h2>
          <Link
            href="/tasks"
            style={{ fontSize: 13, color: 'var(--muted-foreground)', textDecoration: 'none' }}
          >
            All tasks →
          </Link>
        </div>

        {data.activeTasks.length === 0 ? (
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            padding: '32px 24px',
          }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              No active tasks. <Link href="/tasks" style={{ color: 'var(--primary)' }}>Create one</Link>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.activeTasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* Per-task daily-streak chart */}
      <TaskStreakChart tasks={data.taskCharts} />
    </div>
  )
}

function TaskRow({ task }: { task: import('@/lib/queries/dashboard').ActiveTask }) {
  const days = daysUntil(task.due_date)
  const due = formatDays(days)

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.name}
        </p>
        {due && (
          <p style={{
            margin: '3px 0 0',
            fontSize: 12,
            color: due.color,
            fontWeight: due.bold ? 700 : 500,
          }}>
            {due.label}
          </p>
        )}
      </div>
      {task.due_cards > 0 && (
        <span style={{
          padding: '3px 10px',
          borderRadius: 999,
          background: 'color-mix(in srgb, #f97316 16%, transparent)',
          color: '#ea580c',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.04em',
        }}>
          {task.due_cards} DUE
        </span>
      )}
    </Link>
  )
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: number
  suffix?: string
  accent?: string
}) {
  return (
    <div style={cardStyle}>
      <p style={overlineStyle}>{label}</p>
      <p style={{
        margin: '6px 0 0',
        fontSize: 26,
        fontWeight: 800,
        color: accent ?? 'var(--foreground)',
        letterSpacing: '-0.02em',
      }}>
        {value}{' '}
        {suffix && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '20px 22px',
}

const overlineStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
}

function daysUntil(dueDate: string | null): number | null {
  if (!dueDate) return null
  return Math.ceil(
    (new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
    86_400_000,
  )
}

function formatDays(days: number | null): { label: string; color: string; bold: boolean } | null {
  if (days === null) return null
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, color: '#ef4444', bold: true }
  if (days === 0) return { label: 'Due today', color: '#f97316', bold: true }
  if (days === 1) return { label: '1 day left', color: '#f97316', bold: true }
  if (days <= 7)  return { label: `${days} days left`, color: '#eab308', bold: true }
  return { label: `${days} days left`, color: 'var(--muted-foreground)', bold: false }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
