import { requireUser } from '@/utils/supabase/auth'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/library', label: 'Library' },
  { href: '/cards', label: 'Cards' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/review', label: 'Review' },
  { href: '/settings', label: 'Settings' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth — middleware already handles redirects,
  // but this ensures SSR never renders protected content unauthenticated.
  await requireUser()

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">SR</span>
          <div className="flex items-center gap-4 text-sm">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}

function SignOutButton() {
  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Sign out
      </button>
    </form>
  )
}
