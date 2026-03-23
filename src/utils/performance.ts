import { formatLocal as formatLocalTimeString } from '@/lib/kst-time';

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
    return formatLocalTimeString(d);
}

/**
 * Formats an ISO date string or Date object to a local date string (MM/DD)
 */
export function formatLocalDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
}

/**
 * Formats time range. If start and end dates are different, includes date info.
 * @param startTime - Start time ISO string or Date
 * @param endTime - End time ISO string or Date (optional)
 * @returns Formatted time range string
 */
export function formatTimeRange(startTime: string | Date, endTime?: string | Date | null): string {
    const start = new Date(startTime);
    const startTimeStr = formatLocalTimeString(start);
    
    if (!endTime) {
        return startTimeStr;
    }
    
    const end = new Date(endTime);
    const endTimeStr = formatLocalTimeString(end);
    
    // Check if dates are different (different days)
    const startDate = start.toDateString();
    const endDate = end.toDateString();
    
    if (startDate !== endDate) {
        // Different dates - show full date + time
        const startDateStr = start.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const endDateStr = end.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
    }
    
    // Same date - just show time range
    return `${startTimeStr} - ${endTimeStr}`;
}
