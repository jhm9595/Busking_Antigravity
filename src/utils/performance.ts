export type PerformanceStatus = 'planned' | 'live' | 'completed' | 'cancelled';

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
    if (dbStatus === 'cancelled' || dbStatus === 'completed') {
        return dbStatus;
    }

    // If DB says planned but time is past start, it's effectively live
    if (dbStatus === 'planned' && now >= start) {
        // If there's an end time and we are past it, it might be completed 
        // (though usually we wait for the singer to end it manually)
        if (end && now >= end) {
            return 'live'; // Still call it live until manually ended or a certain threshold
        }
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
