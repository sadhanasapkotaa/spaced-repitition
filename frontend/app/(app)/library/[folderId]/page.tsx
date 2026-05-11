import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFolder } from '@/lib/queries/folders'
import { getCardsByFolder } from '@/lib/queries/cards'
import { getTags } from '@/lib/queries/tags'
import CardItem from '@/components/library/card-item'
import CardForm from '@/components/library/card-form'
import FolderTagFilter from '@/components/library/folder-tag-filter'
import FolderImportButton from '@/components/library/folder-import-button'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ folderId: string }>
  searchParams: Promise<{ tag?: string }>
}

export default async function FolderPage({ params, searchParams }: Props) {
  const { folderId } = await params
  const { tag: tagFilter } = await searchParams

  const [folder, allCards, tagsWithCount] = await Promise.all([
    getFolder(folderId).catch(() => null),
    getCardsByFolder(folderId).catch(() => [] as Awaited<ReturnType<typeof getCardsByFolder>>),
    getTags().catch(() => []),
  ])

  if (!folder) notFound()

  const cards = tagFilter
    ? allCards.filter(c =>
        c.card_tags?.some(ct => ct.tag_id === tagFilter),
      )
    : allCards

  const allTags = tagsWithCount.map(t => ({ id: t.id, name: t.name }))

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--muted-foreground)',
        marginBottom: 16,
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
        marginBottom: 18,
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {folder.name}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)' }}>
          {cards.length} of {allCards.length} card{allCards.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <CardForm folderId={folderId} />
        <FolderImportButton folderId={folderId} />
      </div>

      {allTags.length > 0 && (
        <FolderTagFilter
          folderId={folderId}
          tags={allTags}
          activeTagId={tagFilter ?? null}
        />
      )}

      {cards.length === 0 ? (
        <p style={{
          color: 'var(--muted-foreground)',
          fontSize: 14,
          padding: '32px 0',
          textAlign: 'center',
        }}>
          {tagFilter
            ? 'No cards match this tag.'
            : 'No cards yet. Add one above.'}
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} allTags={allTags} />
          ))}
        </div>
      )}
    </div>
  )
}
