import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getFolders } from '@/lib/queries/folders'
import FolderCard from '@/components/library/folder-card'
import FolderForm from '@/components/library/folder-form'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const [folders, supabase] = await Promise.all([
    getFolders(),
    createClient(),
  ])

  const [{ count: orphanedCount }, { count: flaggedCount }] = await Promise.all([
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .is('folder_id', null),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('is_flagged', true),
  ])

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Library
        </h1>
        <FolderForm />
      </div>

      {/* Special views */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
        marginBottom: 24,
      }}>
        <SpecialLink
          href="/library/orphaned"
          icon="📥"
          label="Uncategorized"
          count={orphanedCount ?? 0}
          hint="Cards not in any folder"
        />
        <SpecialLink
          href="/library/flagged"
          icon="⚑"
          label="Flagged"
          count={flaggedCount ?? 0}
          hint="Cards marked for review"
          accent="#eab308"
        />
      </div>

      {/* Folders */}
      <h2 style={{
        margin: '0 0 10px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
      }}>
        Folders
      </h2>

      {!folders.length ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
          No folders yet. Create one to get started.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {folders.map(folder => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  )
}

function SpecialLink({
  href,
  icon,
  label,
  count,
  hint,
  accent,
}: {
  href: string
  icon: string
  label: string
  count: number
  hint: string
  accent?: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.12s, box-shadow 0.12s',
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: accent ? `color-mix(in srgb, ${accent} 16%, transparent)` : 'var(--muted)',
        color: accent ?? 'var(--foreground)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
          {label}{' '}
          <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>
            · {count}
          </span>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>
          {hint}
        </p>
      </div>
    </Link>
  )
}
