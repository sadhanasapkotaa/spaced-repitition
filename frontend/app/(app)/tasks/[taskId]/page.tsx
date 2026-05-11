import { notFound } from 'next/navigation'
import { getTask, getTaskProgress, getTaskFolders } from '@/lib/queries/tasks'
import { getAllFoldersWithPath } from '@/lib/queries/folders'
import TaskDetail from '@/components/tasks/task-detail'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ taskId: string }>
}

export default async function TaskPage({ params }: Props) {
  const { taskId } = await params

  const [task, progress, taskFolders, allFolders] = await Promise.all([
    getTask(taskId).catch(() => null),
    getTaskProgress(taskId),
    getTaskFolders(taskId).catch(() => []),
    getAllFoldersWithPath(),
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
