import { getTags } from '@/lib/queries/tags'
import TagManager from '@/components/tags/tag-manager'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Tags
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--muted-foreground)' }}>
          Group cards by topic. Tags work across all folders.
        </p>
      </div>

      <TagManager tags={tags} />
    </div>
  )
}
