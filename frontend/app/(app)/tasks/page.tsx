import { createClient } from '@/utils/supabase/server'
import type { TaskRow } from '@/types/database'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Tasks</h1>
      {!tasks?.length ? (
        <p className="text-zinc-500 dark:text-zinc-400">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task: TaskRow) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                className={`h-2 w-2 rounded-full flex-shrink-0 ${
                  task.is_completed ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.name}</p>
                {task.due_date && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Due {task.due_date}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
