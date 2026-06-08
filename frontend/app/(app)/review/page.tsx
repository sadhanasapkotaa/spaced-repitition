import { getDueCardsByFolder } from '@/lib/queries/review'
import ReviewFolderList from '@/components/review/review-folder-list'

export const revalidate = 0

export default async function StartReviewPage() {
  const folders = await getDueCardsByFolder()

  return <ReviewFolderList folders={folders} />
}

