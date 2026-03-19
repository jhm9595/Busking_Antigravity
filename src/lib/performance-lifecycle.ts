export type PerformanceStatus = 'live' | 'scheduled' | 'completed'

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000

function normalizePerformanceStatus(currentStatus: string): PerformanceStatus {
  if (currentStatus === 'live' || currentStatus === 'completed') {
    return currentStatus
  }
  return 'scheduled'
}

export function resolvePerformanceStatus(
  startTime: Date,
  endTime: Date | null,
  currentStatus: string
): { status: PerformanceStatus; shouldUpdate: boolean } {
  const normalizedCurrent = normalizePerformanceStatus(currentStatus)
  const now = new Date()
  const safeEndTime = endTime ?? new Date(startTime.getTime() + DEFAULT_DURATION_MS)

  let resolved: PerformanceStatus = normalizedCurrent

  if (safeEndTime <= now) {
    resolved = 'completed'
  } else if (normalizedCurrent === 'scheduled' && startTime <= now) {
    resolved = 'live'
  }

  return {
    status: resolved,
    shouldUpdate: resolved !== normalizedCurrent
  }
}

export function getPerformanceSortKey(performance: {
  isFollowed: boolean
  status: PerformanceStatus
  startTime: Date
}): number {
  const followPriority = performance.isFollowed ? 0 : 1
  const statusPriority = performance.status === 'live' ? 0 : performance.status === 'scheduled' ? 1 : 2

  return followPriority * 1_000_000_000_000_000 + statusPriority * 100_000_000_000_000 + performance.startTime.getTime()
}
