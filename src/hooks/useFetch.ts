'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: unknown
    enabled?: boolean
    onSuccess?: (data: unknown) => void
    onError?: (error: Error) => void
}

interface UseFetchReturn<T> {
    data: T | null
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

export function useFetch<T = unknown>(
    url: string,
    options: UseFetchOptions = {}
): UseFetchReturn<T> {
    const {
        method = 'GET',
        headers = {},
        body,
        enabled = true,
        onSuccess,
        onError,
    } = options

    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const mountedRef = useRef(true)

    const fetchData = useCallback(async () => {
        if (!enabled || !url) return

        setLoading(true)
        setError(null)

        try {
            const requestOptions: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            }

            if (body && method !== 'GET') {
                requestOptions.body = JSON.stringify(body)
            }

            const response = await fetch(url, requestOptions)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const result = await response.json()

            if (mountedRef.current) {
                setData(result)
                onSuccess?.(result)
            }
        } catch (err) {
            if (mountedRef.current) {
                const error = err instanceof Error ? err : new Error('Unknown error')
                setError(error)
                onError?.(error)
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false)
            }
        }
    }, [url, method, JSON.stringify(body), enabled, headers, onSuccess, onError])

    useEffect(() => {
        mountedRef.current = true
        fetchData()

        return () => {
            mountedRef.current = false
        }
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}

// Helper hook for simple GET requests with automatic refresh
export function useFetchData<T = unknown>(
    url: string | null,
    refreshKey?: number
): UseFetchReturn<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = useCallback(async () => {
        if (!url) return

        setLoading(true)
        try {
            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            setData(result)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
    }, [url])

    useEffect(() => {
        fetchData()
    }, [fetchData, refreshKey])

    return { data, loading, error, refetch: fetchData }
}
