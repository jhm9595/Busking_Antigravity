'use client'

import React, { useState } from 'react'
import PerformanceItem from './PerformanceItem'
import styles from '@/styles/singer/PerformanceList.module.css'
import { useLanguage } from '@/contexts/LanguageContext'
import { deletePerformance } from '@/services/singer'
import { RotateCcw } from 'lucide-react'
import { getEffectiveStatus } from '@/utils/performance'

interface PerformanceListProps {
    performances: any[]
    loading: boolean
    allSongs: any[]
    onRefresh?: () => void
    initialLoading?: boolean
    activeTab: 'live' | 'upcoming' | 'past'
    onTabChange: (tab: 'live' | 'upcoming' | 'past') => void
}

export default function PerformanceList({ performances, loading, allSongs, onRefresh, initialLoading, activeTab, onTabChange }: PerformanceListProps) {
    const { t } = useLanguage()
    const [expandedPerfId, setExpandedPerfId] = useState<string | null>(null)
    const [deletingIds, setDeletingIds] = useState<string[]>([])
    const [timers, setTimers] = useState<Record<string, any>>({})

    const live = performances.filter(p => getEffectiveStatus(p) === 'live')

    const upcoming = performances.filter(p => {
        const status = getEffectiveStatus(p)
        return status === 'planned' || status === 'scheduled'
    })

    const past = performances.filter(p => {
        const status = getEffectiveStatus(p)
        return status === 'completed' || status === 'canceled'
    })

    const displayList = activeTab === 'live' ? live : (activeTab === 'upcoming' ? upcoming : [...past].reverse())

    const toggleExpand = (id: string) => {
        setExpandedPerfId(expandedPerfId === id ? null : id)
    }

    const handleDeleteRequest = (id: string, title: string) => {
        // Optimistically remove from view (via deletingIds)
        setDeletingIds(prev => [...prev, id])

        // Set timer for actual delete
        const timer = setTimeout(async () => {
            await deletePerformance(id)
            // Remove from timers and deletingIds after successful delete (although list rebuild will handle it)
            setDeletingIds(prev => prev.filter(did => did !== id))
            const newTimers = { ...timers }
            delete newTimers[id]
            setTimers(newTimers)
        }, 3000) // 3 seconds to undo

        setTimers(prev => ({ ...prev, [id]: timer }))
    }

    const handleUndo = (id: string) => {
        // Clear timer
        if (timers[id]) {
            clearTimeout(timers[id])
            const newTimers = { ...timers }
            delete newTimers[id]
            setTimers(newTimers)
        }
        // Restore view
        setDeletingIds(prev => prev.filter(did => did !== id))
    }

    if (initialLoading && performances.length === 0) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                ))}
            </div>
        )
    }

    return (
        <div>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'live' ? 'text-red-500 border-red-500 font-bold' : ''}`}
                    onClick={() => onTabChange('live')}
                >
                    {t('performance.status.live')} ({live.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
                    onClick={() => onTabChange('upcoming')}
                >
                    {t('performance.upcoming')} ({upcoming.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'past' ? styles.activeTab : ''}`}
                    onClick={() => onTabChange('past')}
                >
                    {t('performance.past')} ({past.length})
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {displayList.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>
                            {activeTab === 'live' ? t('performance.list.empty_live') : (activeTab === 'upcoming' ? t('performance.list.empty_upcoming') : t('performance.list.empty_past'))}
                        </p>
                        {activeTab === 'upcoming' && (
                            <p className={styles.emptySub}>{t('performance.list.add_hint')}</p>
                        )}
                        {activeTab === 'live' && (
                            <p className={styles.emptySub}>{t('performance.list.live_hint')}</p>
                        )}
                    </div>
                ) : (
                    displayList.map((perf) => {
                        if (deletingIds.includes(perf.id)) {
                            return (
                                <div key={perf.id} className="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center animate-pulse">
                                    <span>Deleted <strong>{perf.title}</strong></span>
                                    <button
                                        onClick={() => handleUndo(perf.id)}
                                        className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm flex items-center"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1" /> {t('common.undo')}
                                    </button>
                                </div>
                            )
                        }

                        return (
                            <PerformanceItem
                                key={perf.id}
                                performance={perf}
                                expanded={expandedPerfId === perf.id}
                                onToggleExpand={() => toggleExpand(perf.id)}
                                isPast={activeTab === 'past'}
                                allSongs={allSongs}
                                onDelete={() => handleDeleteRequest(perf.id, perf.title)}
                                onRefresh={onRefresh}
                            />
                        )
                    })
                )}
            </div>

            {/* Background Loading Indicator */}
            {loading && performances.length > 0 && (
                <div className="fixed bottom-8 right-8 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs font-bold">Refreshing...</span>
                </div>
            )}
        </div>
    )
}
