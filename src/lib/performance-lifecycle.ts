export type PerformanceLifecycleStatus = 'planned' | 'scheduled' | 'live' | 'completed' | 'canceled'

const AUTO_COMPLETE_SOURCE_STATUSES = new Set<PerformanceLifecycleStatus>(['planned', 'scheduled', 'live'])
const AUTO_LIVE_SOURCE_STATUSES = new Set<PerformanceLifecycleStatus>(['planned', 'scheduled'])

type LifecycleInput = {
  status?: string | null
  startTime: string | Date
  endTime?: string | Date | null
}

const FALLBACK_DURATION_MS = 3 * 60 * 60 * 1000

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

export function normalizePerformanceStatus(status: string | null | undefined): PerformanceLifecycleStatus {
  if (!status) {
    return 'planned'
  }

  const normalized = status.toLowerCase()
  if (normalized === 'cancelled') {
    return 'canceled'
  }

  if (normalized === 'canceled' || normalized === 'planned' || normalized === 'scheduled' || normalized === 'live' || normalized === 'completed') {
    return normalized
  }

  return 'planned'
}

export function resolvePerformanceLifecycleStatus(
  performance: LifecycleInput,
  options?: { now?: Date }
): PerformanceLifecycleStatus {
  const now = options?.now ?? new Date()
  const status = normalizePerformanceStatus(performance.status)

  if (status === 'canceled' || status === 'completed') {
    return status
  }

  const start = parseDate(performance.startTime)
  if (!start) {
    return status
  }

  const end = parseDate(performance.endTime) ?? new Date(start.getTime() + FALLBACK_DURATION_MS)

  if (now >= end && AUTO_COMPLETE_SOURCE_STATUSES.has(status)) {
    return 'completed'
  }

  if (now >= start && AUTO_LIVE_SOURCE_STATUSES.has(status)) {
    return 'live'
  }

  return status
}
