import { createClient } from '@/utils/supabase/server'
import type { FolderRow } from '@/types/database'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .is('parent_id', null)
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Library</h1>
      {!folders?.length ? (
        <p className="text-zinc-500 dark:text-zinc-400">No folders yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {folders.map((folder: FolderRow) => (
            <li
              key={folder.id}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {folder.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
