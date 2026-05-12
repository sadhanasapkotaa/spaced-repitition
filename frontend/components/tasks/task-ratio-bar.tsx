// Green = days the habit was checked off, red = days it was missed.
// Ratio is doneDays : missedDays over the task's active window, so e.g.
// a 3-day streak + 2 misses + 5-day streak (8 of 10 days) renders as
// 80% green | 20% red.
export const taskBarColors = {
  done:   '#22c55e',
  missed: '#ef4444',
} as const

interface Props {
  doneDays: number
  totalDays: number
  height?: number
}

export function TaskRatioBar({ doneDays, totalDays, height = 14 }: Props) {
  // No active days yet — show an empty rail rather than an all-red bar.
  if (totalDays <= 0) {
    return (
      <div
        style={{
          height,
          borderRadius: 999,
          background: 'var(--muted)',
        }}
      />
    )
  }

  const missedDays = Math.max(0, totalDays - doneDays)

  return (
    <div
      role="img"
      aria-label={`${doneDays} of ${totalDays} days completed`}
      style={{
        display: 'flex',
        height,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'var(--muted)',
      }}
    >
      {doneDays > 0 && (
        <div style={{ flex: doneDays, background: taskBarColors.done }} />
      )}
      {missedDays > 0 && (
        <div style={{ flex: missedDays, background: taskBarColors.missed }} />
      )}
    </div>
  )
}
