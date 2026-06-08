'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { buildSessionQueue } from '@/utils/sr-algorithm'
import { gradeCard, endSession } from '@/lib/actions/review'
import type { ReviewOutcome } from '@/utils/sr-algorithm'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: string
  front: string
  back: string
  hint: string | null
  color: string | null
  difficulty: number
  repeat_interval: number
  review_count: number
  next_review_time: string | null
  created_at: string
  folder_id: string | null
}

interface Props {
  cards: Card[]
  sessionId: string
  folderName?: string
  folderPath?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD  = 80    // px before a swipe registers
const SWIPE_VELOCITY   = 0.3   // px/ms minimum velocity
const ROTATION_FACTOR  = 0.12  // how much the card rotates while dragging
const DRAG_MOVE_CUTOFF = 12    // px — below this, pointer move counts as a tap

// ─── Swipe hint labels ────────────────────────────────────────────────────────

const HINT = {
  pass: { label: 'GOT IT', color: '#22c55e', dir: '→' },
  fail: { label: 'MISSED', color: '#ef4444', dir: '←' },
  hard: { label: 'TRICKY', color: '#f59e0b', dir: '↑' },
} as const

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReviewScreen({ cards, sessionId, folderName, folderPath }: Props) {
  const router = useRouter()

  // Build the queue once on mount
  const queue = buildSessionQueue(
    cards.map(c => ({
      ...c,
      next_review_time: c.next_review_time ? new Date(c.next_review_time) : null,
      created_at: new Date(c.created_at),
    })),
  )

  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done,    setDone]    = useState(false)
  const [summary, setSummary] = useState({ pass: 0, hard: 0, fail: 0 })
  const [grading, setGrading] = useState(false)

  // Drag / physics state
  const [drag,   setDrag]   = useState({ x: 0, y: 0 })
  const [flying, setFlying] = useState<ReviewOutcome | null>(null)

  const cardRef    = useRef<HTMLDivElement>(null)
  const startRef   = useRef<{ x: number; y: number; t: number } | null>(null)
  const draggedRef = useRef(false)   // true if pointer moved past tap threshold

  // Derived
  const current  = queue[index]?.card ?? null
  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0

  // ── Swipe hint opacity ──────────────────────────────────────────────────────

  const passOpacity = Math.max(0, Math.min(1,  drag.x / SWIPE_THRESHOLD))
  const failOpacity = Math.max(0, Math.min(1, -drag.x / SWIPE_THRESHOLD))
  const hardOpacity = Math.max(0, Math.min(1, -drag.y / SWIPE_THRESHOLD))

  // ── Grade a card ────────────────────────────────────────────────────────────

  const grade = useCallback(async (outcome: ReviewOutcome) => {
    if (!current || grading) return
    setGrading(true)

    setFlying(outcome)
    await sleep(300)

    await gradeCard(current.id, sessionId, outcome, {
      difficulty:      current.difficulty,
      repeat_interval: current.repeat_interval,
      review_count:    current.review_count,
    })

    setSummary(s => ({ ...s, [outcome]: s[outcome] + 1 }))

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      await endSession(sessionId)
      setDone(true)
    } else {
      setIndex(nextIndex)
      setFlipped(false)
      setDrag({ x: 0, y: 0 })
      setFlying(null)
    }

    setGrading(false)
  }, [current, grading, index, queue.length, sessionId])

  // ── Pointer handlers ────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    cardRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dx) > DRAG_MOVE_CUTOFF || Math.abs(dy) > DRAG_MOVE_CUTOFF) {
      draggedRef.current = true
    }
    setDrag({ x: dx, y: dy })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return

    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    const dt = Date.now() - startRef.current.t
    const vx = Math.abs(dx) / dt
    const vy = Math.abs(dy) / dt
    startRef.current = null

    const hardEnough = (dist: number, vel: number) =>
      Math.abs(dist) > SWIPE_THRESHOLD || vel > SWIPE_VELOCITY

    if (flipped) {
      if (dy < 0 && hardEnough(dy, vy) && Math.abs(dy) > Math.abs(dx)) {
        grade('hard')
      } else if (dx > 0 && hardEnough(dx, vx)) {
        grade('pass')
      } else if (dx < 0 && hardEnough(dx, vx)) {
        grade('fail')
      } else {
        setDrag({ x: 0, y: 0 })
      }
    } else {
      setDrag({ x: 0, y: 0 })
    }
  }, [flipped, grade])

  // Tap to flip (toggle) — fires after pointerUp; skip if it was a drag
  const onCardClick = useCallback(() => {
    if (draggedRef.current) return
    setFlipped(f => !f)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped(f => !f)
        return
      }
      if (!flipped) return
      if (e.code === 'ArrowRight') grade('pass')
      if (e.code === 'ArrowLeft')  grade('fail')
      if (e.code === 'ArrowUp')    grade('hard')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, grade])

  // ── Fly-off transform ───────────────────────────────────────────────────────

  function getFlyTransform(): string {
    if (flying === 'pass') return 'translate(120vw, -10vh) rotate(30deg)'
    if (flying === 'fail') return 'translate(-120vw, -10vh) rotate(-30deg)'
    if (flying === 'hard') return 'translate(0, -120vh) rotate(5deg)'
    return ''
  }

  const cardTransform = flying
    ? getFlyTransform()
    : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * ROTATION_FACTOR}deg)`

  const cardTransition = flying
    ? 'transform 0.3s cubic-bezier(0.4, 0, 1, 1)'
    : drag.x !== 0 || drag.y !== 0
    ? 'none'
    : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (queue.length === 0) {
    return (
      <div style={styles.center}>
        <div style={styles.emptyIcon}>🎉</div>
        <h2 style={styles.emptyTitle}>All caught up!</h2>
        <p style={styles.emptyText}>No cards due right now. Come back later.</p>
        <button style={styles.btnPrimary} onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  // ── Session summary ─────────────────────────────────────────────────────────

  if (done) {
    const total = summary.pass + summary.hard + summary.fail
    const pct   = total > 0 ? Math.round((summary.pass / total) * 100) : 0
    return (
      <div style={styles.center}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryEmoji}>
            {pct >= 80 ? '🔥' : pct >= 50 ? '💪' : '📖'}
          </div>
          <h2 style={styles.summaryTitle}>Session Complete</h2>
          <p style={styles.summaryScore}>{pct}% correct</p>

          <div style={styles.summaryGrid}>
            <div style={{ ...styles.summaryCell, color: '#22c55e' }}>
              <span style={styles.summaryCellNum}>{summary.pass}</span>
              <span style={styles.summaryCellLabel}>Got it</span>
            </div>
            <div style={{ ...styles.summaryCell, color: '#f59e0b' }}>
              <span style={styles.summaryCellNum}>{summary.hard}</span>
              <span style={styles.summaryCellLabel}>Tricky</span>
            </div>
            <div style={{ ...styles.summaryCell, color: '#ef4444' }}>
              <span style={styles.summaryCellNum}>{summary.fail}</span>
              <span style={styles.summaryCellLabel}>Missed</span>
            </div>
          </div>

          <button style={styles.btnPrimary} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Review loop ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>

      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Folder context and counter */}
      <div style={styles.topBar}>
        {folderName && (
          <div style={styles.folderContext}>
            <p style={styles.folderContextText}>
              {folderPath}
            </p>
          </div>
        )}
        <div style={styles.counter}>
          <span style={styles.counterCurrent}>{index + 1}</span>
          <span style={styles.counterSep}> / </span>
          <span>{queue.length}</span>
        </div>
      </div>

      {/* Swipe hint badges */}
      {flipped && (
        <>
          <div style={{ ...styles.badge, ...styles.badgePass, opacity: passOpacity }}>
            {HINT.pass.dir} {HINT.pass.label}
          </div>
          <div style={{ ...styles.badge, ...styles.badgeFail, opacity: failOpacity }}>
            {HINT.fail.label} {HINT.fail.dir}
          </div>
          <div style={{ ...styles.badge, ...styles.badgeHard, opacity: hardOpacity }}>
            {HINT.hard.dir} {HINT.hard.label}
          </div>
        </>
      )}

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          ...styles.card,
          borderTop: current?.color
            ? `4px solid ${current.color}`
            : '4px solid transparent',
          transform: cardTransform,
          transition: cardTransition,
          cursor: flipped ? 'grab' : 'pointer',
          userSelect: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onCardClick}
      >
        {!flipped ? (
          <div style={styles.cardInner}>
            <span style={styles.cardSide}>FRONT</span>
            <p style={styles.cardText}>{current?.front}</p>
            <span style={styles.tapHint}>tap to reveal</span>
          </div>
        ) : (
          <div style={styles.cardInner}>
            <span style={styles.cardSide}>BACK</span>
            <p style={styles.cardText}>{current?.back}</p>
            {current?.hint && (
              <p style={styles.cardHint}>💡 {current.hint}</p>
            )}
            <span style={styles.tapHint}>tap to flip back · swipe to grade</span>
          </div>
        )}
      </div>

      {/* Grade buttons — desktop fallback */}
      {flipped && (
        <div style={styles.buttons}>
          <button
            style={{ ...styles.btn, ...styles.btnFail }}
            onClick={() => grade('fail')}
            disabled={grading}
          >
            ← Missed
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnHard }}
            onClick={() => grade('hard')}
            disabled={grading}
          >
            ↑ Tricky
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnPass }}
            onClick={() => grade('pass')}
            disabled={grading}
          >
            Got it →
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      <p style={styles.keyboardHint}>
        {flipped
          ? '← fail  ↑ hard  → pass  space flip back'
          : 'tap or space to flip'}
      </p>

    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--background)',
    position: 'relative',
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'var(--muted)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    transition: 'width 0.4s ease',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: 'calc(100% - 40px)',
  },
  folderContext: {
    maxWidth: '60%',
  },
  folderContextText: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    margin: 0,
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  counter: {
    fontSize: 13,
    color: 'var(--muted-foreground)',
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
  },
  counterCurrent: { fontWeight: 700, color: 'var(--foreground)' },
  counterSep:     { margin: '0 2px' },

  badge: {
    position: 'absolute',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: '0.08em',
    pointerEvents: 'none',
    transition: 'opacity 0.1s',
    border: '2px solid currentColor',
  },
  badgePass: {
    top: '40%',
    right: 32,
    color: '#22c55e',
    transform: 'rotate(12deg)',
  },
  badgeFail: {
    top: '40%',
    left: 32,
    color: '#ef4444',
    transform: 'rotate(-12deg)',
  },
  badgeHard: {
    top: 80,
    left: '50%',
    transform: 'translateX(-50%) rotate(-4deg)',
    color: '#f59e0b',
  },

  card: {
    width: '100%',
    maxWidth: 420,
    minHeight: 280,
    background: 'var(--card)',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    touchAction: 'none',
    willChange: 'transform',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    textAlign: 'center',
  },
  cardSide: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'var(--muted-foreground)',
  },
  cardText: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--foreground)',
    lineHeight: 1.5,
    margin: 0,
  },
  cardHint: {
    fontSize: 14,
    color: 'var(--muted-foreground)',
    margin: 0,
    fontStyle: 'italic',
  },
  tapHint: {
    fontSize: 11,
    color: 'var(--muted-foreground)',
    marginTop: 8,
    letterSpacing: '0.05em',
  },

  buttons: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
  },
  btn: {
    padding: '12px 20px',
    borderRadius: 12,
    border: 'none',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
  },
  btnFail: { background: '#fef2f2', color: '#ef4444' },
  btnHard: { background: '#fffbeb', color: '#d97706' },
  btnPass: { background: '#f0fdf4', color: '#16a34a' },

  keyboardHint: {
    marginTop: 24,
    fontSize: 11,
    color: 'var(--muted-foreground)',
    letterSpacing: '0.05em',
    fontFamily: 'monospace',
  },

  center: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    textAlign: 'center',
  },
  emptyIcon:  { fontSize: 56 },
  emptyTitle: { fontSize: 24, fontWeight: 700, margin: 0 },
  emptyText:  { fontSize: 15, color: 'var(--muted-foreground)', margin: 0 },

  summaryCard: {
    background: 'var(--card)',
    borderRadius: 24,
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    maxWidth: 360,
    width: '100%',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  },
  summaryEmoji: { fontSize: 56 },
  summaryTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  summaryScore: { fontSize: 40, fontWeight: 800, margin: 0 },
  summaryGrid:  { display: 'flex', gap: 24, margin: '8px 0' },
  summaryCell:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  summaryCellNum:   { fontSize: 28, fontWeight: 800 },
  summaryCellLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },

  btnPrimary: {
    marginTop: 8,
    padding: '14px 32px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
