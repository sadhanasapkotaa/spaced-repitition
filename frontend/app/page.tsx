import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
    }}>
      <Header />
      <Hero />  
      <Features />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px max(20px, calc((100% - 1080px) / 2))',
      borderBottom: '1px solid var(--border)',
    }}>
      <Wordmark />
      <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link
          href="/login"
          style={{
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textDecoration: 'none',
            borderRadius: 8,
          }}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          style={{
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 700,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            textDecoration: 'none',
            borderRadius: 10,
          }}
        >
          Get started
        </Link>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section style={{
      padding: '96px max(20px, calc((100% - 1080px) / 2)) 64px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 22,
    }}>
      <span style={{
        padding: '5px 12px',
        borderRadius: 999,
        background: 'var(--muted)',
        color: 'var(--muted-foreground)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}>
        Spaced repetition · SM-2 algorithm
      </span>

      <h1 style={{
        margin: 0,
        fontSize: 'clamp(40px, 7vw, 72px)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1.05,
        maxWidth: 820,
      }}>
        Study less.<br/>
        Remember more.
      </h1>

      <p style={{
        margin: 0,
        fontSize: 'clamp(15px, 1.4vw, 18px)',
        color: 'var(--muted-foreground)',
        maxWidth: 560,
        lineHeight: 1.55,
      }}>
        monk paces your reviews using spaced repetition so you only see cards
        when you're about to forget them. Build streaks, organize by folder
        and tag, link tasks to whole subtrees.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/register"
          style={{
            padding: '14px 28px',
            fontSize: 15,
            fontWeight: 700,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            textDecoration: 'none',
            borderRadius: 12,
          }}
        >
          Start studying →
        </Link>
        <Link
          href="/login"
          style={{
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--foreground)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
        >
          I have an account
        </Link>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section style={{
      padding: '24px max(20px, calc((100% - 1080px) / 2)) 96px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14,
      }}>
        <FeatureCard
          title="SM-2 with fuzz"
          body="Cards reappear right before you forget. The algorithm spaces intervals automatically and adds jitter so same-day adds don't cluster forever."
        />
        <FeatureCard
          title="Folders, all the way down"
          body="Nest folders to whatever depth your subject demands. Linking a task to a parent folder pulls in every descendant — no manual fan-out."
        />
        <FeatureCard
          title="Tasks with real deadlines"
          body="Group cards into a task with a due date. See pass rate, due-card counts, and progress at a glance from the dashboard."
        />
        <FeatureCard
          title="Bulk import + tags"
          body="Paste a CSV to seed a folder. Tag cards across folders to filter and review by topic without reshuffling your tree."
        />
      </div>
    </section>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      padding: '20px 22px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
    }}>
      <h3 style={{
        margin: '0 0 6px',
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: 'var(--muted-foreground)',
        lineHeight: 1.55,
      }}>
        {body}
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '24px max(20px, calc((100% - 1080px) / 2))',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <Wordmark muted />
      <p style={{
        margin: 0,
        fontSize: 12,
        color: 'var(--muted-foreground)',
      }}>
        Built for focused study.
      </p>
    </footer>
  )
}

function Wordmark({ muted }: { muted?: boolean }) {
  return (
    <Link
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: muted ? 'var(--muted-foreground)' : 'var(--foreground)',
        textDecoration: 'none',
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 8,
        background: 'var(--primary)',
        color: 'var(--primary-foreground)',
        fontSize: 14,
      }}>
        ✦
      </span>
      monk
    </Link>
  )
}
