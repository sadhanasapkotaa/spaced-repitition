import { getAppUser } from '@/utils/supabase/auth'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DailyGoalForm from '@/components/settings/daily-goal-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [appUser, supabase] = await Promise.all([
    getAppUser(),
    createClient(),
  ])

  const { data: settings } = await supabase
    .from('user_settings')
    .select('daily_goal')
    .eq('id', appUser?.id ?? 0)
    .maybeSingle()

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('id', appUser?.id ?? 0)
    .maybeSingle()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ margin: '0 0 28px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Settings
      </h1>

      <Section title="Daily review">
        <Row label="Daily goal">
          <DailyGoalForm initial={settings?.daily_goal ?? 20} />
        </Row>
      </Section>

      <Section title="Account">
        <Row label="Email">
          <p style={valueStyle}>{appUser?.email ?? '—'}</p>
        </Row>
        <Row label="Username">
          <p style={valueStyle}>{appUser?.username ?? '—'}</p>
        </Row>
        <Row label="Current streak">
          <p style={valueStyle}>
            {streak?.current_streak ?? 0}{' '}
            <span style={{ fontWeight: 500, color: 'var(--muted-foreground)' }}>
              day{(streak?.current_streak ?? 0) === 1 ? '' : 's'}
            </span>
          </p>
        </Row>
        <Row label="Longest streak">
          <p style={valueStyle}>
            {streak?.longest_streak ?? 0}{' '}
            <span style={{ fontWeight: 500, color: 'var(--muted-foreground)' }}>
              day{(streak?.longest_streak ?? 0) === 1 ? '' : 's'}
            </span>
          </p>
        </Row>
      </Section>

      <Section title="Session">
        <form action={signOut}>
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--foreground)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </form>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{
        margin: '0 0 10px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        minWidth: 120,
      }}>
        {label}
      </p>
      <div style={{ textAlign: 'right' }}>{children}</div>
    </div>
  )
}

const valueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--foreground)',
}
