import { useState, useEffect, useCallback } from 'react'

export function useSongs(singerId: string | undefined | null, refreshKey?: number) {
    const [songs, setSongs] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    const fetchSongs = useCallback(async () => {
        if (!singerId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/singers/${singerId}`)
            if (!res.ok) throw new Error('Failed to fetch songs')
            const data = await res.json()
            setSongs(data.songs || [])
            setError(null)
        } catch (err) {
            console.error('Failed to load songs:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [singerId])

    useEffect(() => {
        fetchSongs()
    }, [fetchSongs, refreshKey])

    return { songs, loading, error, refresh: fetchSongs }
}

export function usePerformances(singerId: string | undefined | null, refreshKey?: number) {
    const [performances, setPerformances] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)

    const fetchPerformances = useCallback(async () => {
        if (!singerId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/singers/${singerId}`)
            if (!res.ok) throw new Error('Failed to fetch performances')
            const data = await res.json()
            setPerformances(data.performances || [])
            setError(null)
        } catch (err) {
            console.error('Failed to load performances:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [singerId])

    useEffect(() => {
        fetchPerformances()
    }, [fetchPerformances, refreshKey])

    return { performances, loading, error, refresh: fetchPerformances }
}
