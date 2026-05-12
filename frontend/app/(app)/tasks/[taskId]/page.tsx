import { notFound } from 'next/navigation'
import {
  getTask,
  getTaskProgress,
  getTaskFolders,
  getTaskCompletions,
  computeStreak,
  todayDateStr,
} from '@/lib/queries/tasks'
import { getAllFoldersWithPath } from '@/lib/queries/folders'
import TaskDetail from '@/components/tasks/task-detail'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ taskId: string }>
}

export default async function TaskPage({ params }: Props) {
  const { taskId } = await params

  const [task, progress, taskFolders, allFolders, completions] = await Promise.all([
    getTask(taskId).catch(() => null),
    getTaskProgress(taskId),
    getTaskFolders(taskId).catch(() => []),
    getAllFoldersWithPath(),
    getTaskCompletions(taskId).catch(() => [] as string[]),
  ])

  if (!task) notFound()

  const assignedFolderIds = taskFolders.map(tf => tf.folder_id)
  const today = todayDateStr()

  return (
    <TaskDetail
      task={task}
      progress={progress}
      assignedFolderIds={assignedFolderIds}
      allFolders={allFolders}
      doneToday={completions.includes(today)}
      streak={computeStreak(completions, today)}
      completions={completions}
    />
  )
}
