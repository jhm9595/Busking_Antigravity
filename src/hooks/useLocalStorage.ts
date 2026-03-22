'use client'

import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((prevValue: T) => T)
type RemoveValue = () => void

interface UseLocalStorageReturn<T> {
    value: T
    setValue: (value: SetValue<T>) => void
    removeValue: RemoveValue
    isLoading: boolean
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T
): UseLocalStorageReturn<T> {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? (JSON.parse(item) as T) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    const [isLoading, setIsLoading] = useState(true)

    // Initialize on mount
    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false)
            return
        }
        try {
            const item = window.localStorage.getItem(key)
            if (item) {
                setStoredValue(JSON.parse(item) as T)
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
        }
        setIsLoading(false)
    }, [key])

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue: UseLocalStorageReturn<T>['setValue'] = useCallback(
        (value: SetValue<T>) => {
            try {
                // Allow value to be a function so we have same API as useState
                const valueToStore =
                    value instanceof Function ? value(storedValue) : value
                setStoredValue(valueToStore)
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore))
                }
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error)
            }
        },
        [key, storedValue]
    )

    const removeValue: RemoveValue = useCallback(() => {
        try {
            setStoredValue(initialValue)
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key)
            }
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error)
        }
    }, [key, initialValue])

    return { value: storedValue, setValue, removeValue, isLoading }
}

// Hook for string-only storage (simpler API)
export function useLocalStorageString(
    key: string,
    initialValue: string
): UseLocalStorageReturn<string> {
    const [storedValue, setStoredValue] = useState<string>(() => {
        if (typeof window === 'undefined') return initialValue
        return window.localStorage.getItem(key) ?? initialValue
    })

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false)
            return
        }
        const item = window.localStorage.getItem(key)
        if (item) setStoredValue(item)
        setIsLoading(false)
    }, [key])

    const setValue: UseLocalStorageReturn<string>['setValue'] = useCallback(
        (value: SetValue<string>) => {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, valueToStore)
            }
        },
        [key, storedValue]
    )

    const removeValue = useCallback(() => {
        setStoredValue(initialValue)
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
        }
    }, [key, initialValue])

    return { value: storedValue, setValue, removeValue, isLoading }
}
