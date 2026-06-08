import { getDueCardsByFolder } from '@/lib/queries/review'
import ReviewScreen from '@/components/review/review-screen'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

interface Props {
  params: Promise<{ folderId: string }>
}

export default async function FolderReviewPage({ params }: Props) {
  const { folderId } = await params

  // Get all folders with due cards
  const folders = await getDueCardsByFolder()

  // Find the selected folder
  const selectedFolder = folders.find(f => f.id === folderId)

  if (!selectedFolder || selectedFolder.cards.length === 0) {
    return (
      <div style={styles.error}>
        <div style={styles.errorContent}>
          <h1 style={styles.errorTitle}>Folder not found or no cards to review</h1>
          <p style={styles.errorText}>
            This folder either doesn't exist or has no cards that need review.
          </p>
          <Link href="/review" style={styles.backLink}>
            ← Back to Folders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <Link href="/review" style={styles.backLink}>
          ← Back to Folders
        </Link>
        <div style={styles.folderInfo}>
          <h2 style={styles.folderName}>{selectedFolder.name}</h2>
          <p style={styles.folderPath}>{selectedFolder.pathString}</p>
          <p style={styles.cardInfo}>
            {selectedFolder.dueCardCount} card{selectedFolder.dueCardCount !== 1 ? 's' : ''} ready for review
          </p>
        </div>
      </div>

      <ReviewScreen 
        cards={selectedFolder.cards} 
        sessionId={`folder-${folderId}`}
        folderName={selectedFolder.name}
        folderPath={selectedFolder.pathString}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: 'var(--background)',
  },
  header: {
    borderBottom: '1px solid var(--border)',
    padding: '20px 24px',
    background: 'var(--card)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backLink: {
    fontSize: 14,
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-block',
    marginBottom: 12,
    transition: 'opacity 0.2s',
  },
  folderInfo: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  folderName: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    marginBottom: 6,
  },
  folderPath: {
    fontSize: 13,
    color: 'var(--muted-foreground)',
    margin: 0,
    marginBottom: 8,
  },
  cardInfo: {
    fontSize: 14,
    color: 'var(--muted-foreground)',
    margin: 0,
    fontWeight: 500,
  },
  error: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorContent: {
    textAlign: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: 'var(--muted-foreground)',
    margin: 0,
    marginBottom: 24,
  },
}
