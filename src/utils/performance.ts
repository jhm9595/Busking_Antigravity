export type PerformanceStatus = 'planned' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'canceled';

/**
 * Determines the effective status of a performance by comparing the DB status 
 * with the current time.
 */
export function getEffectiveStatus(performance: {
    status: string;
    startTime: string | Date;
    endTime?: string | Date | null;
}): PerformanceStatus {
    const now = new Date();
    const start = new Date(performance.startTime);
    const end = performance.endTime ? new Date(performance.endTime) : null;
    const dbStatus = performance.status as PerformanceStatus;

    // If cancelled or completed in DB, respect that first
    if (dbStatus === 'cancelled' || dbStatus === 'canceled' || dbStatus === 'completed') {
        return dbStatus;
    }

    // If DB says live, keep it live
    if (dbStatus === 'live') {
        return 'live';
    }

    // If DB says planned or scheduled but time has passed start, it's effectively live
    if ((dbStatus === 'planned' || dbStatus === 'scheduled') && now >= start) {
        return 'live';
    }

    return dbStatus;
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
