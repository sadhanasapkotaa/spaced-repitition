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
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--background)' }}>
      <Sidebar signOut={signOut} />
      <main className="app-main-pad-bottom" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
