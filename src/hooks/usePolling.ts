'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UsePollingOptions {
    interval?: number
    enabled?: boolean
    immediate?: boolean
}

interface UsePollingReturn {
    start: () => void
    stop: () => void
    isPolling: boolean
}

export function usePolling(
    callback: () => void | Promise<void>,
    options: UsePollingOptions = {}
): UsePollingReturn {
    const { interval = 5000, enabled = true, immediate = false } = options

    const [isPolling, setIsPolling] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const callbackRef = useRef(callback)
    const isRunningRef = useRef(false)

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setIsPolling(false)
        isRunningRef.current = false
    }, [])

    const start = useCallback(() => {
        if (isRunningRef.current) return

        isRunningRef.current = true
        setIsPolling(true)

        // Immediate first call
        callbackRef.current()

        intervalRef.current = setInterval(() => {
            callbackRef.current()
        }, interval)
    }, [interval])

    // Start/stop based on enabled
    useEffect(() => {
        if (enabled) {
            if (immediate) {
                start()
            }
        } else {
            stop()
        }

        return () => stop()
    }, [enabled, immediate, start, stop])

    return {
        start,
        stop,
        isPolling,
    }
}

// Hook with automatic refresh counter for forcing updates
interface UsePollingWithRefreshOptions extends UsePollingOptions {
    refreshKey?: number
}

export function usePollingWithRefresh(
    callback: () => void | Promise<void>,
    options: UsePollingWithRefreshOptions = {}
): UsePollingReturn & { refreshCount: number } {
    const [refreshCount, setRefreshCount] = useState(0)
    const { refreshKey, ...pollingOptions } = options

    const wrappedCallback = useCallback(() => {
        callback()
        setRefreshCount((prev) => prev + 1)
    }, [callback])

    const polling = usePolling(wrappedCallback, pollingOptions)

    // Force refresh when key changes
    useEffect(() => {
        if (refreshKey !== undefined && refreshKey > 0) {
            callback()
            setRefreshCount((prev) => prev + 1)
        }
    }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        ...polling,
        refreshCount,
    }
}
