import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getFolder,
  getSubfolders,
  getFolderAncestors,
} from '@/lib/queries/folders'
import { getCardsByFolder } from '@/lib/queries/cards'
import { getTags } from '@/lib/queries/tags'
import CardItem from '@/components/library/card-item'
import CardForm from '@/components/library/card-form'
import FolderCard from '@/components/library/folder-card'
import FolderForm from '@/components/library/folder-form'
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

  const [folder, allCards, tagsWithCount, subfolders, ancestors] = await Promise.all([
    getFolder(folderId).catch(() => null),
    getCardsByFolder(folderId).catch(() => [] as Awaited<ReturnType<typeof getCardsByFolder>>),
    getTags().catch(() => []),
    getSubfolders(folderId).catch(() => [] as Awaited<ReturnType<typeof getSubfolders>>),
    getFolderAncestors(folderId).catch(() => []),
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
      <Breadcrumb ancestors={ancestors} current={folder.name} />

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
          {subfolders.length > 0 && ` · ${subfolders.length} subfolder${subfolders.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <CardForm folderId={folderId} allTags={allTags} />
        <FolderForm parentId={folderId} />
        <FolderImportButton folderId={folderId} />
        {(allCards.length > 0 || subfolders.length > 0) && (
          <Link
            href={`/library/${folderId}/play`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.32)',
            }}
          >
            ▶ Play
          </Link>
        )}
      </div>

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={overlineStyle}>Subfolders</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}>
            {subfolders.map(sub => (
              <FolderCard key={sub.id} folder={sub} />
            ))}
          </div>
        </section>
      )}

      {/* Tag filter — only show if folder has any cards with tags */}
      {allTags.length > 0 && (
        <FolderTagFilter
          folderId={folderId}
          tags={allTags}
          activeTagId={tagFilter ?? null}
        />
      )}

      {/* Cards header (only when subfolders present, so the section is distinguishable) */}
      {subfolders.length > 0 && cards.length > 0 && (
        <h2 style={overlineStyle}>Cards</h2>
      )}

      {cards.length === 0 && subfolders.length === 0 ? (
        <p style={{
          color: 'var(--muted-foreground)',
          fontSize: 14,
          padding: '32px 0',
          textAlign: 'center',
        }}>
          {tagFilter
            ? 'No cards match this tag.'
            : 'No cards or subfolders yet. Add one above.'}
        </p>
      ) : cards.length === 0 && tagFilter ? (
        <p style={{
          color: 'var(--muted-foreground)',
          fontSize: 14,
          padding: '24px 0',
          textAlign: 'center',
        }}>
          No cards match this tag.
        </p>
      ) : cards.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} allTags={allTags} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Breadcrumb({
  ancestors,
  current,
}: {
  ancestors: { id: string; name: string }[]
  current: string
}) {
  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 13,
        color: 'var(--muted-foreground)',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <Link href="/library" style={{ color: 'inherit', textDecoration: 'none' }}>
        Library
      </Link>
      {ancestors.map(a => (
        <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <Link
            href={`/library/${a.id}`}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {a.name}
          </Link>
        </span>
      ))}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: 'var(--muted-foreground)' }}>/</span>
        <span style={{
          color: 'var(--foreground)',
          fontWeight: 600,
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {current}
        </span>
      </span>
    </nav>
  )
}

const overlineStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
}
