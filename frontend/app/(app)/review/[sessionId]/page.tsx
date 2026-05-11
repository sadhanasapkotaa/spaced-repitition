import { redirect } from 'next/navigation'
import { getSession } from '@/lib/queries/review'
import { getDueCards } from '@/lib/queries/review'
import ReviewScreen from '@/components/review/review-screen'

interface Props {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ taskId?: string }>
}

export default async function ReviewSessionPage({ params, searchParams }: Props) {
  const { sessionId } = await params
  const { taskId } = await searchParams

  const session = await getSession(sessionId).catch(() => null)
  if (!session) redirect('/review')

  // Already completed — go to dashboard
  if (session.ended_at) redirect('/dashboard')

  const cards = await getDueCards(taskId)

  return (
    <ReviewScreen
      cards={cards}
      sessionId={sessionId}
    />
  )
}
