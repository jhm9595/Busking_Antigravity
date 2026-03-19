import { formatLocal } from '@/lib/kst-time'

export function formatPerformanceDate(startTime: string | Date, endTime?: string | Date | null): string {
    try {
        const start = new Date(startTime)
        const end = endTime ? new Date(endTime) : null

        if (isNaN(start.getTime())) return 'Invalid Date'

        const dateStr = new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).format(start)
        const timeStr = formatLocal(start)
        const endTimeStr = end ? formatLocal(end) : '?'

        return `${dateStr} ${timeStr} - ${endTimeStr}`
    } catch (e) {
        return 'Date Error'
    }
}
