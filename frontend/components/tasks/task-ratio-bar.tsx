// Muted green/red — visible enough to read at a glance, but tame enough to
// sit alongside the app's otherwise monochrome palette.
export const taskBarColors = {
  done:   '#16a34a',
  missed: '#dc2626',
} as const

interface Props {
  doneDays: number
  totalDays: number
  height?: number
}

export function TaskRatioBar({ doneDays, totalDays, height = 5 }: Props) {
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
        <div style={{ flex: missedDays, background: taskBarColors.missed, opacity: 0.85 }} />
      )}
    </div>
  )
}
