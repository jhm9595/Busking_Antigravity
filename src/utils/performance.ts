import { resolvePerformanceLifecycleStatus } from '@/lib/performance-lifecycle'

export type PerformanceStatus = 'planned' | 'scheduled' | 'live' | 'completed' | 'canceled'

/**
 * Determines the effective status of a performance by comparing the DB status 
 * with the current time.
 */
export function getEffectiveStatus(performance: {
    status: string;
    startTime: string | Date;
    endTime?: string | Date | null;
}): PerformanceStatus {
    return resolvePerformanceLifecycleStatus(performance)
}

/**
 * Formats an ISO date string or Date object to a local time string (HH:mm)
 */
export function formatLocalTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Formats an ISO date string or Date object to a local date string (MM/DD)
 */
export function formatLocalDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
}
