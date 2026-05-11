'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startSession } from '@/lib/actions/review'

export default function StartReviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const sessionId = await startSession()
      router.push(`/review/${sessionId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.icon}>🃏</div>
        <h1 style={styles.title}>Ready to review?</h1>
        <p style={styles.sub}>
          All due cards from your library will be queued up using spaced repetition.
        </p>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Starting…' : 'Start Session'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: 'var(--card)',
    borderRadius: 24,
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    maxWidth: 360,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  },
  icon:  { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:   { fontSize: 15, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 },
  btn: {
    marginTop: 8,
    padding: '14px 40px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
}

