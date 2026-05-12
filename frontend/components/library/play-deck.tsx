'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayCard {
  id: string
  front: string
  back: string
  hint: string | null
  color: string | null
  folderName?: string
  tags?: { id: string; name: string }[]
}

type Mode = 'serial' | 'random'

interface Props {
  cards: PlayCard[]
  folderName: string
  folderId: string
  subfolderCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD  = 90    // px before a swipe registers
const SWIPE_VELOCITY   = 0.4   // px/ms minimum velocity
const ROTATION_FACTOR  = 0.07  // how much the card rotates while dragging
const DRAG_MOVE_CUTOFF = 10    // px — below this, pointer move counts as a tap
const FLY_DURATION     = 320   // ms for card to fly off

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayDeck({ cards, folderName, folderId, subfolderCount }: Props) {
  const router = useRouter()

  const [mode, setMode] = useState<Mode | null>(null)
  const [queue, setQueue] = useState<PlayCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [fly, setFly] = useState<{ x: number; y: number; deg: number } | null>(null)
  const [done, setDone] = useState(false)

  const cardRef    = useRef<HTMLDivElement>(null)
  const startRef   = useRef<{ x: number; y: number; t: number } | null>(null)
  const draggedRef = useRef(false)
  const lockedRef  = useRef(false)

  const total = queue.length
  const current = queue[index] ?? null
  const peek    = queue[index + 1] ?? null

  // ── Start a session ─────────────────────────────────────────────────────────

  const startSession = useCallback((chosenMode: Mode) => {
    const ordered = chosenMode === 'random' ? shuffle(cards) : cards.slice()
    setQueue(ordered)
    setIndex(0)
    setFlipped(false)
    setDrag({ x: 0, y: 0 })
    setFly(null)
    setDone(false)
    setMode(chosenMode)
  }, [cards])

  // ── Advance / regress ───────────────────────────────────────────────────────

  const step = useCallback((delta: 1 | -1, flyDir?: { x: number; y: number }) => {
    if (lockedRef.current) return
    if (delta > 0 && index >= total - 1) {
      lockedRef.current = true
      const dir = flyDir ?? { x: 1, y: -0.3 }
      setFly({ x: dir.x * 140, y: dir.y * 140, deg: dir.x * 30 })
      setTimeout(() => {
        setDone(true)
        setFly(null)
        lockedRef.current = false
      }, FLY_DURATION)
      return
    }
    if (delta < 0 && index === 0) {
      // Bounce: just spring back
      setDrag({ x: 0, y: 0 })
      return
    }

    lockedRef.current = true
    const dir = flyDir ?? { x: delta, y: -0.3 }
    setFly({ x: dir.x * 140, y: dir.y * 140, deg: dir.x * 30 })

    setTimeout(() => {
      setIndex(i => i + delta)
      setFlipped(false)
      setDrag({ x: 0, y: 0 })
      setFly(null)
      lockedRef.current = false
    }, FLY_DURATION)
  }, [index, total])

  const shuffleDeck = useCallback(() => {
    if (lockedRef.current) return
    setQueue(q => shuffle(q))
    setIndex(0)
    setFlipped(false)
    setDrag({ x: 0, y: 0 })
    setFly(null)
    setDone(false)
  }, [])

  // ── Pointer handlers ────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (lockedRef.current) return
    draggedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
    cardRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current || lockedRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dx) > DRAG_MOVE_CUTOFF || Math.abs(dy) > DRAG_MOVE_CUTOFF) {
      draggedRef.current = true
    }
    setDrag({ x: dx, y: dy })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!startRef.current || lockedRef.current) {
      startRef.current = null
      return
    }
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    const dt = Math.max(1, Date.now() - startRef.current.t)
    const vx = Math.abs(dx) / dt
    const vy = Math.abs(dy) / dt
    startRef.current = null

    const horizontal = Math.abs(dx) >= Math.abs(dy)
    const dist = horizontal ? dx : dy
    const vel  = horizontal ? vx : vy
    const swiped = Math.abs(dist) > SWIPE_THRESHOLD || vel > SWIPE_VELOCITY

    if (!swiped) {
      setDrag({ x: 0, y: 0 })
      return
    }

    // Right or up = next; left or down = previous
    const forward = horizontal ? dx > 0 : dy < 0
    const normX = horizontal ? Math.sign(dx) : dx / Math.max(80, Math.abs(dy))
    const normY = horizontal ? dy / Math.max(80, Math.abs(dx)) : Math.sign(dy)
    step(forward ? 1 : -1, { x: normX, y: normY })
  }, [step])

  const onCardClick = useCallback(() => {
    if (draggedRef.current || lockedRef.current) return
    setFlipped(f => !f)
  }, [])

  // ── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mode || done) return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped(f => !f)
        return
      }
      if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
        e.preventDefault()
        step(1, e.code === 'ArrowUp' ? { x: 0, y: -1 } : { x: 1, y: -0.2 })
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
        e.preventDefault()
        step(-1, e.code === 'ArrowDown' ? { x: 0, y: 1 } : { x: -1, y: 0.2 })
      } else if (e.code === 'KeyS') {
        e.preventDefault()
        shuffleDeck()
      } else if (e.code === 'Escape') {
        e.preventDefault()
        router.push(`/library/${folderId}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, done, step, shuffleDeck, router, folderId])

  // ── Empty state (no cards at all) ───────────────────────────────────────────

  if (cards.length === 0) {
    return (
      <div style={styles.root}>
        <div style={styles.centerCol}>
          <div style={{ fontSize: 56 }}>🎴</div>
          <h2 style={styles.title}>No cards to play yet</h2>
          <p style={styles.sub}>
            Add some cards to <strong>{folderName}</strong> or its subfolders first.
          </p>
          <button style={styles.btnPrimary} onClick={() => router.push(`/library/${folderId}`)}>
            ← Back to folder
          </button>
        </div>
      </div>
    )
  }

  // ── Mode picker ─────────────────────────────────────────────────────────────

  if (!mode) {
    return (
      <div style={styles.root}>
        <button
          onClick={() => router.push(`/library/${folderId}`)}
          style={styles.exitBtn}
          aria-label="Back to folder"
        >
          ✕
        </button>

        <div style={styles.pickerCol}>
          <div style={styles.pickerHeader}>
            <p style={styles.kicker}>PLAY · {folderName}</p>
            <h1 style={styles.bigTitle}>How do you want to play?</h1>
            <p style={styles.sub}>
              {total} card{total === 1 ? '' : 's'}
              {subfolderCount > 0 && ` from ${subfolderCount + 1} folder${subfolderCount === 0 ? '' : 's'}`}
              {' · just flip and swipe — no scores, no streaks.'}
            </p>
          </div>

          <div style={styles.modeGrid}>
            <ModeCard
              emoji="📚"
              title="Serial"
              desc="Go through the deck in order, newest first."
              accent="#3b82f6"
              onClick={() => startSession('serial')}
            />
            <ModeCard
              emoji="🎲"
              title="Random"
              desc="Shuffle the whole deck. Surprise yourself."
              accent="#a855f7"
              onClick={() => startSession('random')}
            />
          </div>

          <p style={styles.tipText}>
            Tip · Tap to flip · Swipe (or use ←→↑↓) to move · S to shuffle
          </p>
        </div>
      </div>
    )
  }

  // ── End screen ──────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div style={styles.root}>
        <div style={styles.centerCol}>
          <div style={styles.partyEmoji}>🎉</div>
          <h2 style={styles.title}>Deck complete</h2>
          <p style={styles.sub}>
            You flipped through all {total} card{total === 1 ? '' : 's'} of <strong>{folderName}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              style={styles.btnPrimary}
              onClick={() => {
                setQueue(mode === 'random' ? shuffle(queue) : queue)
                setIndex(0)
                setFlipped(false)
                setDone(false)
              }}
            >
              ↻ Play again
            </button>
            <button
              style={styles.btnGhost}
              onClick={() => setMode(null)}
            >
              Change mode
            </button>
            <button
              style={styles.btnGhost}
              onClick={() => router.push(`/library/${folderId}`)}
            >
              ← Back to folder
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Active deck ─────────────────────────────────────────────────────────────

  const dragTransform = fly
    ? `translate(${fly.x}vw, ${fly.y}vh) rotate(${fly.deg}deg)`
    : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * ROTATION_FACTOR}deg)`

  const dragTransition = fly
    ? `transform ${FLY_DURATION}ms cubic-bezier(0.4, 0, 1, 1), opacity ${FLY_DURATION}ms ease-out`
    : (drag.x !== 0 || drag.y !== 0)
    ? 'none'
    : 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)'

  // Drag affordance hints
  const dragMag = Math.max(Math.abs(drag.x), Math.abs(drag.y))
  const hintOpacity = Math.min(1, dragMag / SWIPE_THRESHOLD)
  const horizontal = Math.abs(drag.x) >= Math.abs(drag.y)
  const forwardHint = horizontal ? drag.x > 0 : drag.y < 0
  const nextOpacity = forwardHint ? hintOpacity : 0
  const prevOpacity = forwardHint ? 0 : hintOpacity

  return (
    <div style={styles.root}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button
          onClick={() => router.push(`/library/${folderId}`)}
          style={styles.exitBtnInline}
          aria-label="Exit"
        >
          ✕
        </button>
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((index + (fly ? 1 : 0)) / total) * 100}%`,
              }}
            />
          </div>
          <span style={styles.counter}>
            <strong style={{ color: 'var(--foreground)' }}>{Math.min(index + 1, total)}</strong>
            <span style={{ opacity: 0.5 }}> / {total}</span>
          </span>
        </div>
        <button
          onClick={shuffleDeck}
          style={styles.shuffleBtn}
          title="Shuffle (S)"
          aria-label="Shuffle deck"
        >
          🎲
        </button>
      </div>

      {/* Swipe direction hints */}
      <div style={{ ...styles.swipeHint, ...styles.swipeHintNext, opacity: nextOpacity }}>
        NEXT →
      </div>
      <div style={{ ...styles.swipeHint, ...styles.swipeHintPrev, opacity: prevOpacity }}>
        ← BACK
      </div>

      {/* Deck stack */}
      <div style={styles.deckStage}>
        {/* Peek card (next, behind) */}
        {peek && (
          <div
            style={{
              ...styles.card,
              ...styles.peekCard,
              background: tintFor(peek.color, 14),
              border: `1px solid ${borderFor(peek.color)}`,
              borderTop: `4px solid ${peek.color ?? 'transparent'}`,
              transform: `scale(${0.94 + hintOpacity * 0.04}) translateY(${16 - hintOpacity * 12}px)`,
              opacity: 0.7 + hintOpacity * 0.3,
            }}
            aria-hidden
          >
            <div style={styles.cardFace}>
              <span style={styles.cardSide}>UP NEXT</span>
              <p style={{ ...styles.cardText, fontSize: 18, opacity: 0.6 }}>
                {peek.front}
              </p>
            </div>
          </div>
        )}

        {/* Active card */}
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onCardClick}
          style={{
            ...styles.card,
            ...styles.activeCard,
            background: tintFor(current?.color ?? null, 22),
            border: `1px solid ${borderFor(current?.color ?? null)}`,
            borderTop: `4px solid ${current?.color ?? 'transparent'}`,
            transform: dragTransform,
            transition: dragTransition,
            opacity: fly ? 0 : 1,
            cursor: 'grab',
          }}
        >
          <div
            style={{
              ...styles.flipper,
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front face */}
            <div style={{ ...styles.cardFace, ...styles.faceFront }}>
              <span style={styles.cardSide}>FRONT</span>
              <p style={styles.cardText}>{current?.front}</p>
              {current?.folderName && current.folderName !== folderName && (
                <span style={styles.folderTag}>📁 {current.folderName}</span>
              )}
              {current?.tags && current.tags.length > 0 && (
                <div style={styles.tagRow}>
                  {current.tags.map(t => (
                    <span key={t.id} style={styles.tagChip}>{t.name}</span>
                  ))}
                </div>
              )}
              <span style={styles.tapHint}>tap to flip</span>
            </div>

            {/* Back face */}
            <div style={{ ...styles.cardFace, ...styles.faceBack }}>
              <span style={styles.cardSide}>BACK</span>
              <p style={styles.cardText}>{current?.back}</p>
              {current?.hint && (
                <p style={styles.cardHint}>💡 {current.hint}</p>
              )}
              <span style={styles.tapHint}>tap to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={styles.controls}>
        <button
          onClick={() => step(-1)}
          disabled={index === 0}
          style={{ ...styles.ctrlBtn, opacity: index === 0 ? 0.35 : 1 }}
          title="Previous (← or ↓)"
          aria-label="Previous card"
        >
          ←
        </button>
        <button
          onClick={() => setFlipped(f => !f)}
          style={{ ...styles.ctrlBtn, ...styles.ctrlBtnPrimary }}
          title="Flip (Space)"
          aria-label="Flip card"
        >
          {flipped ? '↺ FRONT' : '↻ FLIP'}
        </button>
        <button
          onClick={() => step(1)}
          style={styles.ctrlBtn}
          title="Next (→ or ↑)"
          aria-label="Next card"
        >
          →
        </button>
      </div>

      <p style={styles.keyboardHint}>
        space flip · ← → ↑ ↓ move · s shuffle · esc exit
      </p>
    </div>
  )
}

// ─── ModeCard ─────────────────────────────────────────────────────────────────

function ModeCard({
  emoji, title, desc, accent, onClick,
}: { emoji: string; title: string; desc: string; accent: string; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  const [press, setPress] = useState(false)

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => { setHover(false); setPress(false) }}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        padding: '24px 22px',
        background: 'var(--card)',
        border: `2px solid ${hover ? accent : 'var(--border)'}`,
        borderRadius: 20,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s, box-shadow 0.15s',
        transform: press ? 'scale(0.97)' : hover ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hover ? `0 12px 32px ${accent}33` : '0 1px 2px rgba(0,0,0,0.04)',
        color: 'inherit',
        font: 'inherit',
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
        {desc}
      </span>
    </button>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function tintFor(color: string | null | undefined, pct: number): string {
  if (!color) return 'var(--card)'
  return `color-mix(in srgb, ${color} ${pct}%, var(--card))`
}

function borderFor(color: string | null | undefined): string {
  if (!color) return 'var(--border)'
  return `color-mix(in srgb, ${color} 38%, var(--border))`
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    background: 'var(--background)',
    position: 'relative',
    overflow: 'hidden',
  },

  // Mode picker
  pickerCol: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 32,
    padding: '40px 8px',
  },
  pickerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'center',
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
  },
  bigTitle: {
    margin: 0,
    fontSize: 'clamp(28px, 6vw, 44px)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  tipText: {
    margin: 0,
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--muted-foreground)',
    letterSpacing: '0.04em',
  },

  // Top bar (active deck)
  topBar: {
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 4px 12px',
  },
  exitBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--muted-foreground)',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnInline: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--muted-foreground)',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleBtn: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    background: 'var(--muted)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    transition: 'width 0.32s ease',
  },
  counter: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 48,
    textAlign: 'right',
  },

  // Swipe direction hints
  swipeHint: {
    position: 'absolute',
    top: '46%',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '0.15em',
    padding: '8px 14px',
    borderRadius: 8,
    pointerEvents: 'none',
    transition: 'opacity 0.12s',
    background: 'var(--card)',
    border: '2px solid var(--primary)',
    color: 'var(--primary)',
    zIndex: 5,
  },
  swipeHintNext: {
    right: 'calc(50% - 200px)',
    transform: 'rotate(12deg)',
  },
  swipeHintPrev: {
    left: 'calc(50% - 200px)',
    transform: 'rotate(-12deg)',
  },

  // Deck stage
  deckStage: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    perspective: 1400,
    minHeight: 320,
  },
  card: {
    position: 'absolute',
    width: '100%',
    maxWidth: 420,
    aspectRatio: '3 / 4',
    maxHeight: 'min(70vh, 560px)',
    borderRadius: 24,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
    willChange: 'transform',
    transformStyle: 'preserve-3d',
  },
  peekCard: {
    transformOrigin: 'center top',
    transition: 'transform 0.25s ease, opacity 0.25s ease',
    pointerEvents: 'none',
  },
  activeCard: {
    touchAction: 'none',
    userSelect: 'none',
  },
  flipper: {
    position: 'absolute',
    inset: 0,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.55s cubic-bezier(0.34, 1.2, 0.64, 1)',
  },
  cardFace: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: '32px 28px',
    textAlign: 'center',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 24,
  },
  faceFront: {},
  faceBack: {
    transform: 'rotateY(180deg)',
  },
  cardSide: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.18em',
    color: 'var(--muted-foreground)',
  },
  cardText: {
    margin: 0,
    fontSize: 'clamp(20px, 4.5vw, 26px)',
    fontWeight: 600,
    color: 'var(--foreground)',
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
  },
  cardHint: {
    margin: 0,
    fontSize: 13,
    color: 'var(--muted-foreground)',
    fontStyle: 'italic',
    maxWidth: 320,
  },
  folderTag: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    background: 'var(--muted)',
    padding: '3px 10px',
    borderRadius: 999,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  tagChip: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: 'var(--muted)',
    color: 'var(--muted-foreground)',
  },
  tapHint: {
    fontSize: 11,
    color: 'var(--muted-foreground)',
    letterSpacing: '0.05em',
    marginTop: 'auto',
  },

  // Bottom controls
  controls: {
    display: 'flex',
    gap: 10,
    padding: '12px 0 4px',
    width: '100%',
    maxWidth: 420,
    justifyContent: 'center',
  },
  ctrlBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.15s, background 0.12s',
  },
  ctrlBtnPrimary: {
    flex: 2,
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
    letterSpacing: '0.05em',
  },
  keyboardHint: {
    margin: '10px 0 4px',
    fontSize: 10.5,
    color: 'var(--muted-foreground)',
    letterSpacing: '0.06em',
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Empty / end / centered states
  centerCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    textAlign: 'center',
    padding: '40px 24px',
    maxWidth: 460,
  },
  title:  { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' },
  sub:    { margin: 0, fontSize: 15, color: 'var(--muted-foreground)', lineHeight: 1.55 },
  partyEmoji: { fontSize: 64 },

  btnPrimary: {
    marginTop: 8,
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnGhost: {
    marginTop: 8,
    padding: '12px 18px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--foreground)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
}
