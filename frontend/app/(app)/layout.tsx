import { requireUser } from '@/utils/supabase/auth'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar, BottomNav } from '@/components/nav/app-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth — middleware already handles redirects,
  // but this ensures SSR never renders protected content unauthenticated.
  await requireUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--background)' }}>
      <Sidebar signOut={signOut} />
      <main className="flex-1 min-w-0 pb-18 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
