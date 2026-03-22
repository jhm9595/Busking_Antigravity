'use client'

import { useState, useCallback, useRef } from 'react'

interface UseAsyncOptions<T> {
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    onSettled?: (data: T | null, error: Error | null) => void
}

interface UseAsyncReturn<T> {
    data: T | null
    error: Error | null
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
    execute: () => Promise<T | null>
    reset: () => void
}

export function useAsync<T>(
    asyncFunction: () => Promise<T>,
    options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
    const { onSuccess, onError, onSettled } = options

    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const mountedRef = useRef(true)

    const execute = useCallback(async (): Promise<T | null> => {
        if (isLoading) return null

        setIsLoading(true)
        setError(null)
        setIsSuccess(false)

        try {
            const result = await asyncFunction()

            if (mountedRef.current) {
                setData(result)
                setIsSuccess(true)
                onSuccess?.(result)
            }

            return result
        } catch (err) {
            if (mountedRef.current) {
                const error = err instanceof Error ? err : new Error('Unknown error')
                setError(error)
                onError?.(error)
            }

            return null
        } finally {
            if (mountedRef.current) {
                setIsLoading(false)
                onSettled?.(data, error)
            }
        }
    }, [asyncFunction, isLoading, onSuccess, onError, onSettled, data, error])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setIsLoading(false)
        setIsSuccess(false)
    }, [])

    return {
        data,
        error,
        isLoading,
        isSuccess,
        isError: error !== null,
        execute,
        reset,
    }
}

// Hook for async operations with automatic execution
interface UseAsyncAutoOptions<T> extends UseAsyncOptions<T> {
    immediate?: boolean
}

export function useAsyncAuto<T>(
    asyncFunction: () => Promise<T>,
    options: UseAsyncAutoOptions<T> = {}
): UseAsyncReturn<T> {
    const { immediate = false, ...asyncOptions } = options
    const hook = useAsync(asyncFunction, asyncOptions)

    if (immediate && !hook.isLoading && !hook.isSuccess && !hook.isError && hook.data === null) {
        hook.execute()
    }

    return hook
}

// Hook for dependent async operations
interface UseDependentAsyncOptions<T, Deps extends unknown[]>
    extends UseAsyncOptions<T> {
    dependencies: Deps
    condition?: (deps: Deps) => boolean
}

export function useDependentAsync<T, Deps extends unknown[]>(
    asyncFunction: (deps: Deps) => Promise<T>,
    options: UseDependentAsyncOptions<T, Deps>
): UseAsyncReturn<T> & { deps: Deps | null } {
    const { dependencies, condition, onSuccess, onError, onSettled } = options

    const [deps, setDeps] = useState<Deps | null>(null)
    const hook = useAsync<T>(
        () => (deps && (!condition || condition(deps)) ? asyncFunction(deps) : Promise.resolve(null as unknown as T)),
        { onSuccess, onError, onSettled }
    )

    // Update deps when they change
    if (dependencies !== deps) {
        setDeps(dependencies)
    }

    return {
        ...hook,
        deps,
    }
}
