'use server'

import { createClient } from '@/utils/supabase/server'
import { getAppUser } from '@/utils/supabase/auth'
import { revalidatePath } from 'next/cache'

export async function updateDailyGoal(goal: number) {
  if (!Number.isFinite(goal) || goal < 1 || goal > 500) {
    throw new Error('Daily goal must be between 1 and 500.')
  }

  const appUser = await getAppUser()
  if (!appUser) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { id: appUser.id, daily_goal: Math.round(goal), updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )

  if (error) throw error

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}
