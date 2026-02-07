export function formatPerformanceDate(startTime: string | Date, endTime?: string | Date | null): string {
    try {
        const start = new Date(startTime)
        const end = endTime ? new Date(endTime) : null

        if (isNaN(start.getTime())) return 'Invalid Date'

        const dateStr = start.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        })
        const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const endTimeStr = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '?'

        return `${dateStr} ${timeStr} - ${endTimeStr}`
    } catch (e) {
        return 'Date Error'
    }
}
