'use client'

import Link from 'next/link'
import type { FolderWithDueCards } from '@/lib/queries/review'
import cssStyles from './review-folder-list.module.css'

interface ReviewFolderListProps {
  folders: FolderWithDueCards[]
}

export default function ReviewFolderList({ folders }: ReviewFolderListProps) {
  const totalCards = folders.reduce((sum, f) => sum + f.dueCardCount, 0)

  if (folders.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>✓</div>
        <h2 style={styles.emptyTitle}>All caught up!</h2>
        <p style={styles.emptyText}>No cards need review right now. Great job!</p>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h1 style={styles.title}>Review by Folder</h1>
        <p style={styles.subtitle}>
          {totalCards} card{totalCards !== 1 ? 's' : ''} ready for review across {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={styles.folderGrid}>
        {folders.map((folder) => (
          <Link
            key={folder.id}
            href={`/review/folder/${folder.id}`}
            style={styles.folderCardWrapper}
            className={cssStyles.folderCardWrapper}
          >
            <div style={styles.folderCard} className={cssStyles.folderCard}>
              <div style={styles.folderCardContent}>
                <h3 style={styles.folderName}>{folder.name}</h3>
                <p style={styles.folderPath}>{folder.pathString}</p>
              </div>
              <div style={styles.cardCount}>{folder.dueCardCount}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    padding: '24px',
    background: 'var(--background)',
  },
  header: {
    marginBottom: '32px',
    maxWidth: '1200px',
    margin: '0 auto 32px',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--muted-foreground)',
    margin: 0,
    lineHeight: 1.6,
  },
  empty: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: 'var(--muted-foreground)',
    margin: 0,
  },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  folderCardWrapper: {
    textDecoration: 'none',
    color: 'inherit',
  },
  folderCard: {
    background: 'var(--card)',
    borderRadius: 16,
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid var(--border)',
  },
  folderCardContent: {
    flex: 1,
    minWidth: 0,
  },
  folderName: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    marginBottom: 6,
    wordBreak: 'break-word',
  },
  folderPath: {
    fontSize: 13,
    color: 'var(--muted-foreground)',
    margin: 0,
    wordBreak: 'break-word',
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--primary)',
    minWidth: 40,
    textAlign: 'right',
    flexShrink: 0,
  },
}
