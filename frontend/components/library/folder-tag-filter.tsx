'use client'

import { useRouter } from 'next/navigation'

interface Props {
  folderId: string
  tags: { id: string; name: string }[]
  activeTagId: string | null
}

export default function FolderTagFilter({ folderId, tags, activeTagId }: Props) {
  const router = useRouter()

  function select(tagId: string | null) {
    const url = tagId
      ? `/library/${folderId}?tag=${encodeURIComponent(tagId)}`
      : `/library/${folderId}`
    router.push(url)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 16,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
        marginRight: 4,
      }}>
        Filter
      </span>
      <FilterChip active={activeTagId === null} onClick={() => select(null)}>
        All
      </FilterChip>
      {tags.map(t => (
        <FilterChip
          key={t.id}
          active={activeTagId === t.id}
          onClick={() => select(t.id)}
        >
          {t.name}
        </FilterChip>
      ))}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
