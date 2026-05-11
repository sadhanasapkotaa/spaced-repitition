import Link from 'next/link'
import { getOrphanedCards } from '@/lib/queries/cards'
import { getFolders } from '@/lib/queries/folders'
import { getTags } from '@/lib/queries/tags'
import CardItem from '@/components/library/card-item'
import MoveCardMenu from '@/components/library/move-card-menu'

export const dynamic = 'force-dynamic'

export default async function OrphanedCardsPage() {
  const [cards, folders, tagsWithCount] = await Promise.all([
    getOrphanedCards(),
    getFolders(),
    getTags().catch(() => []),
  ])

  const allTags = tagsWithCount.map(t => ({ id: t.id, name: t.name }))

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
          Uncategorized
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)' }}>
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </p>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--muted-foreground)' }}>
        Cards added without a folder live here. Move them into a folder to organize them.
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
          <div style={{ fontSize: 36, marginBottom: 10 }}>📥</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            No uncategorized cards.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {cards.map(card => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <CardItem card={card} allTags={allTags} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <MoveCardMenu
                  cardId={card.id}
                  currentFolderId={null}
                  folders={folders}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
