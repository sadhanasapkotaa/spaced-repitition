import { notFound } from 'next/navigation'
import { getFolder, getSubfolders } from '@/lib/queries/folders'
import { getCardsInFolderTree } from '@/lib/queries/cards'
import PlayDeck, { type PlayCard } from '@/components/library/play-deck'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ folderId: string }>
}

export default async function PlayPage({ params }: Props) {
  const { folderId } = await params

  const [folder, subfolders, rawCards] = await Promise.all([
    getFolder(folderId).catch(() => null),
    getSubfolders(folderId).catch(() => []),
    getCardsInFolderTree(folderId).catch(() => []),
  ])

  if (!folder) notFound()

  const cards: PlayCard[] = (rawCards ?? []).map(c => ({
    id: c.id,
    front: c.front,
    back: c.back,
    hint: c.hint,
    color: c.color,
    folderName: c.folders?.name,
    tags: c.card_tags?.flatMap(ct => ct.tags ? [{ id: ct.tags.id, name: ct.tags.name }] : []) ?? [],
  }))

  return (
    <PlayDeck
      cards={cards}
      folderName={folder.name}
      folderId={folder.id}
      subfolderCount={subfolders.length}
    />
  )
}
