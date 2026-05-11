import Link from 'next/link'
import { getFlaggedCards } from '@/lib/queries/cards'
import { getTags } from '@/lib/queries/tags'
import CardItem from '@/components/library/card-item'

export const dynamic = 'force-dynamic'

interface FolderRef {
  id: string
  name: string
}

export default async function FlaggedCardsPage() {
  const [cards, tagsWithCount] = await Promise.all([
    getFlaggedCards(),
    getTags().catch(() => []),
  ])

  const allTags = tagsWithCount.map(t => ({ id: t.id, name: t.name }))

  // Group by folder for easier scanning
  const grouped = new Map<string, { folder: FolderRef | null; cards: typeof cards }>()
  for (const card of cards) {
    const folder = (card as unknown as { folders: FolderRef | null }).folders ?? null
    const key = folder?.id ?? '__orphan__'
    if (!grouped.has(key)) grouped.set(key, { folder, cards: [] })
    grouped.get(key)!.cards.push(card)
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--muted-foreground)',
        marginBottom: 18,
      }}>
        <Link href="/library" style={{ color: 'inherit', textDecoration: 'none' }}>
          ← Library
        </Link>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 8,
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#eab308', marginRight: 8 }}>⚑</span>
          Flagged
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)' }}>
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </p>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted-foreground)' }}>
        Cards you flagged for review, grouped by folder. Edit them here, or unflag once they&apos;re fixed.
      </p>

      {cards.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          color: 'var(--muted-foreground)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚐</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            No flagged cards. Cards you flag while reviewing show up here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {Array.from(grouped.values()).map(group => (
            <section key={group.folder?.id ?? 'orphan'}>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 10,
              }}>
                {group.folder ? (
                  <Link
                    href={`/library/${group.folder.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: 'var(--foreground)',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    {group.folder.name}
                  </Link>
                ) : (
                  <Link
                    href="/library/orphaned"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: 'var(--muted-foreground)',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    Uncategorized
                  </Link>
                )}
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  · {group.cards.length}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}>
                {group.cards.map(card => (
                  <CardItem key={card.id} card={card} allTags={allTags} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
