import { getTasks } from '@/lib/queries/tasks'
import TaskCard from '@/components/tasks/task-card'
import TaskForm from '@/components/tasks/task-form'

export default async function TasksPage() {
  const tasks = await getTasks()

  const active    = tasks.filter(t => !t.is_completed)
  const completed = tasks.filter(t =>  t.is_completed)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 16,
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Tasks</h1>
        <TaskForm />
      </div>

      {/* Empty state */}
      {active.length === 0 && completed.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: 'var(--muted-foreground)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--foreground)' }}>
            No tasks yet
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            Create a task to organize your study goals and link folders to it.
          </p>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <SectionLabel text="Active" count={active.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <SectionLabel text="Completed" count={completed.length} muted />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.65 }}>
            {completed.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionLabel({
  text,
  count,
  muted,
}: {
  text: string
  count: number
  muted?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    }}>
      <h2 style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--muted-foreground)',
      }}>
        {text}
      </h2>
      <span style={{
        padding: '1px 7px',
        borderRadius: 20,
        background: muted ? 'var(--muted)' : 'var(--primary)',
        color: muted ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
        fontSize: 11,
        fontWeight: 700,
      }}>
        {count}
      </span>
    </div>
  )
}
