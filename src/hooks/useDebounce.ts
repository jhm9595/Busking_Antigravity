'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// Hook for debounced callback
interface UseDebouncedCallbackOptions {
    delay?: number
    maxWait?: number
}

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
    callback: T,
    options: UseDebouncedCallbackOptions = {}
): T {
    const { delay = 300, maxWait } = options

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
    const [maxWaitTimeoutId, setMaxWaitTimeoutId] = useState<NodeJS.Timeout | null>(null)

    const debouncedCallback = ((...args: Parameters<T>) => {
        // Clear existing timeouts
        if (timeoutId) clearTimeout(timeoutId)
        if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId)

        // Set new timeout
        const newTimeoutId = setTimeout(() => {
            callback(...args)
            setTimeoutId(null)
        }, delay)

        setTimeoutId(newTimeoutId)

        // Set maxWait timeout if specified
        if (maxWait && !maxWaitTimeoutId) {
            const newMaxWaitId = setTimeout(() => {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                    callback(...args)
                    setTimeoutId(null)
                }
                setMaxWaitTimeoutId(null)
            }, maxWait)

            setMaxWaitTimeoutId(newMaxWaitId)
        }
    }) as T

    return debouncedCallback
}

// Hook for debounced state with immediate value access
interface UseDebounceStateOptions<T> {
    initialValue: T
    delay?: number
}

interface UseDebounceStateReturn<T> {
    value: T // The immediate value
    debouncedValue: T // The debounced value
    setValue: (value: T | ((prev: T) => T)) => void
}

export function useDebounceState<T>(
    options: UseDebounceStateOptions<T>
): UseDebounceStateReturn<T> {
    const { initialValue, delay = 300 } = options

    const [value, setValueState] = useState<T>(initialValue)
    const debouncedValue = useDebounce(value, delay)

    const setValue = (newValue: T | ((prev: T) => T)) => {
        setValueState((prev) => (newValue instanceof Function ? newValue(prev) : newValue))
    }

    return {
        value,
        debouncedValue,
        setValue,
    }
}
