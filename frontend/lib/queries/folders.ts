import { createClient } from '@/utils/supabase/server'

export async function getFolders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFolder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getFolderStats(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folder_stats')
    .select('*')
    .eq('folder_id', id)
    .single()
  if (error) throw error
  return data
}
