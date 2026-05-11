import Link from 'next/link'
import { getStatsData } from '@/lib/queries/stats'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const data = await getStatsData()

  const passPct = Math.round(data.totals.passRate30d * 100)
  const maturePct = data.totals.cards > 0
    ? Math.round((data.totals.mature / data.totals.cards) * 100)
    : 0

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Stats
      </h1>

      {/* Summary tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        <Tile label="Total cards" value={data.totals.cards} />
        <Tile label="Mature cards" value={`${maturePct}%`} sub={`${data.totals.mature} cards`} accent={maturePct >= 50 ? '#22c55e' : undefined} />
        <Tile label="Reviews · 30d" value={data.totals.reviews30d} />
        <Tile label="Pass rate · 30d" value={data.totals.reviews30d > 0 ? `${passPct}%` : '—'} accent={passPct >= 80 ? '#22c55e' : undefined} />
      </div>

      {/* Reviews per day */}
      <Section title="Cards reviewed (last 30 days)">
        {data.totals.reviews30d === 0 ? (
          <EmptyMsg>No reviews yet. Start a review session to see data here.</EmptyMsg>
        ) : (
          <ReviewsChart daily={data.dailyReviews} />
        )}
      </Section>

      {/* Pass / Hard / Fail breakdown */}
      {data.totals.reviews30d > 0 && (
        <Section title="Outcome breakdown (last 30 days)">
          <OutcomeBars daily={data.dailyReviews} />
        </Section>
      )}

      {/* Folder maturity */}
      <Section title="Folder maturity">
        {data.folderMaturity.length === 0 ? (
          <EmptyMsg>
            No folders yet. <Link href="/library" style={{ color: 'var(--primary)' }}>Create one →</Link>
          </EmptyMsg>
        ) : (
          <FolderMaturityList folders={data.folderMaturity} />
        )}
      </Section>
    </div>
  )
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function ReviewsChart({ daily }: { daily: import('@/lib/queries/stats').DailyReview[] }) {
  const max = Math.max(1, ...daily.map(d => d.total))
  const width  = 760
  const height = 180
  const padding = { top: 16, right: 12, bottom: 28, left: 32 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const barGap = 2
  const barW = (innerW / daily.length) - barGap

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', minWidth: 520, height: 'auto', display: 'block' }}
        aria-label="Daily review count"
      >
        {/* y gridlines */}
        {[0, 0.5, 1].map(t => {
          const y = padding.top + innerH * (1 - t)
          return (
            <g key={t}>
              <line
                x1={padding.left} x2={padding.left + innerW}
                y1={y} y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={t === 0 ? '' : '2 4'}
              />
              <text
                x={padding.left - 6} y={y + 4}
                fontSize={10}
                fill="var(--muted-foreground)"
                textAnchor="end"
              >
                {Math.round(max * t)}
              </text>
            </g>
          )
        })}

        {/* bars */}
        {daily.map((d, i) => {
          const h = innerH * (d.total / max)
          const x = padding.left + i * (barW + barGap)
          const y = padding.top + innerH - h
          return (
            <g key={d.date}>
              <rect
                x={x} y={y}
                width={barW} height={h}
                rx={2}
                fill="var(--primary)"
                opacity={d.total === 0 ? 0.15 : 0.9}
              >
                <title>{d.date}: {d.total} reviews</title>
              </rect>
            </g>
          )
        })}

        {/* x labels — first, mid, last */}
        {[0, Math.floor(daily.length / 2), daily.length - 1].map(i => (
          <text
            key={i}
            x={padding.left + i * (barW + barGap) + barW / 2}
            y={height - 8}
            fontSize={10}
            fill="var(--muted-foreground)"
            textAnchor="middle"
          >
            {formatShortDate(daily[i].date)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function OutcomeBars({ daily }: { daily: import('@/lib/queries/stats').DailyReview[] }) {
  const total = daily.reduce((s, d) => s + d.total, 0)
  const pass  = daily.reduce((s, d) => s + d.pass, 0)
  const hard  = daily.reduce((s, d) => s + d.hard, 0)
  const fail  = daily.reduce((s, d) => s + d.fail, 0)

  const segments = [
    { label: 'Got it', value: pass, color: '#22c55e' },
    { label: 'Tricky', value: hard, color: '#f59e0b' },
    { label: 'Missed', value: fail, color: '#ef4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex',
        height: 28,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--muted)',
      }}>
        {segments.map(s => (
          s.value > 0 ? (
            <div
              key={s.label}
              style={{
                flex: s.value,
                background: s.color,
              }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {segments.map(s => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3, background: s.color,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                {s.value} · {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FolderMaturityList({ folders }: { folders: import('@/lib/queries/stats').FolderMaturity[] }) {
  const sorted = [...folders].sort((a, b) => b.total_cards - a.total_cards)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(f => {
        const total = f.total_cards
        const maturePct = total > 0 ? (f.mature_cards / total) * 100 : 0
        const duePct = total > 0 ? (f.due_cards / total) * 100 : 0

        return (
          <Link
            key={f.folder_id}
            href={`/library/${f.folder_id}`}
            style={{
              display: 'block',
              padding: '14px 16px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                {f.folder_name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>
                {f.total_cards} card{f.total_cards !== 1 ? 's' : ''}
                {f.due_cards > 0 && (
                  <span style={{ color: '#f97316', fontWeight: 700, marginLeft: 6 }}>
                    · {f.due_cards} due
                  </span>
                )}
                {f.flagged_cards > 0 && (
                  <span style={{ color: '#eab308', fontWeight: 700, marginLeft: 6 }}>
                    · {f.flagged_cards} flagged
                  </span>
                )}
              </p>
            </div>

            <div style={{
              position: 'relative',
              height: 8,
              background: 'var(--muted)',
              borderRadius: 999,
              overflow: 'hidden',
            }}>
              {/* Mature segment */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${maturePct}%`,
                background: '#22c55e',
              }} />
              {/* Due segment overlaid on the right */}
              <div style={{
                position: 'absolute',
                right: 0, top: 0, bottom: 0,
                width: `${duePct}%`,
                background: '#f97316',
                opacity: 0.7,
              }} />
            </div>

            <div style={{
              display: 'flex',
              gap: 14,
              marginTop: 6,
              fontSize: 11,
              color: 'var(--muted-foreground)',
            }}>
              <Legend color="#22c55e">{Math.round(maturePct)}% mature</Legend>
              {f.due_cards > 0 && <Legend color="#f97316">{Math.round(duePct)}% due</Legend>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {children}
    </span>
  )
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{
        margin: '0 0 12px',
        fontSize: 12,
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
        padding: '18px 20px',
      }}>
        {children}
      </div>
    </section>
  )
}

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>
      <p style={{
        margin: '4px 0 0', fontSize: 22, fontWeight: 800,
        color: accent ?? 'var(--foreground)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted-foreground)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: 0,
      fontSize: 13,
      color: 'var(--muted-foreground)',
      textAlign: 'center',
      padding: '8px 0',
    }}>
      {children}
    </p>
  )
}

function formatShortDate(ymd: string): string {
  const [, m, d] = ymd.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}
