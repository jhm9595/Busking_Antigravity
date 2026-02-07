import { useState, useEffect, useCallback } from 'react'
import { getSongs, getPerformances } from '@/services/singer'

export function useSongs(singerId: string | undefined | null, refreshKey?: number) {
    const [songs, setSongs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    const fetchSongs = useCallback(async () => {
        if (!singerId) return
        setLoading(true)
        try {
            const data = await getSongs(singerId)
            setSongs(data)
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
    const [performances, setPerformances] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    const fetchPerformances = useCallback(async () => {
        if (!singerId) return
        setLoading(true)
        try {
            const data = await getPerformances(singerId)
            setPerformances(data)
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
