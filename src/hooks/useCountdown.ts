'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCountdownOptions {
    autoStart?: boolean
    onComplete?: () => void
}

interface UseCountdownReturn {
    count: number
    isRunning: boolean
    isComplete: boolean
    start: (seconds?: number) => void
    stop: () => void
    reset: () => void
}

export function useCountdown(
    initialSeconds: number = 0,
    options: UseCountdownOptions = {}
): UseCountdownReturn {
    const { autoStart = false, onComplete } = options

    const [count, setCount] = useState(initialSeconds)
    const [isRunning, setIsRunning] = useState(autoStart)
    const [isComplete, setIsComplete] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const onCompleteRef = useRef(onComplete)

    // Keep ref updated
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const start = useCallback((seconds?: number) => {
        const targetSeconds = seconds ?? initialSeconds
        setCount(targetSeconds)
        setIsComplete(false)
        setIsRunning(true)

        clearTimer()

        intervalRef.current = setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    clearTimer()
                    setIsRunning(false)
                    setIsComplete(true)
                    onCompleteRef.current?.()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [initialSeconds, clearTimer])

    const stop = useCallback(() => {
        clearTimer()
        setIsRunning(false)
    }, [clearTimer])

    const reset = useCallback(() => {
        clearTimer()
        setCount(initialSeconds)
        setIsRunning(false)
        setIsComplete(false)
    }, [initialSeconds, clearTimer])

    // Auto-start effect
    useEffect(() => {
        if (autoStart && initialSeconds > 0) {
            start(initialSeconds)
        }
    }, []) // Only run once on mount

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimer()
    }, [clearTimer])

    return {
        count,
        isRunning,
        isComplete,
        start,
        stop,
        reset,
    }
}

// Variant with auto-redirect functionality
export function useCountdownRedirect(
    initialSeconds: number,
    redirectUrl: string,
    options: UseCountdownOptions = {}
): UseCountdownReturn {
    const countdown = useCountdown(initialSeconds, {
        ...options,
        onComplete: () => {
            if (typeof window !== 'undefined') {
                window.location.href = redirectUrl
            }
        },
    })

    return countdown
}
