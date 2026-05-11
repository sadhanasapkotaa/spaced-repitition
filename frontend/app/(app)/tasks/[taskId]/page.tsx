import { notFound } from 'next/navigation'
import { getTask, getTaskProgress, getTaskFolders } from '@/lib/queries/tasks'
import { getFolders } from '@/lib/queries/folders'
import TaskDetail from '@/components/tasks/task-detail'

interface Props {
  params: Promise<{ taskId: string }>
}

export default async function TaskPage({ params }: Props) {
  const { taskId } = await params

  const [task, progress, taskFolders, allFolders] = await Promise.all([
    getTask(taskId).catch(() => null),
    getTaskProgress(taskId),
    getTaskFolders(taskId).catch(() => []),
    getFolders(),
  ])

  if (!task) notFound()

  const assignedFolderIds = taskFolders.map(tf => tf.folder_id)

  return (
    <TaskDetail
      task={task}
      progress={progress}
      assignedFolderIds={assignedFolderIds}
      allFolders={allFolders}
    />
  )
}
