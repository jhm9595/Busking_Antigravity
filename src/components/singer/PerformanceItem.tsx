import React, { useState } from 'react'
import { MapPin, Clock, ChevronDown, ChevronUp, Music, Link as LinkIcon, Settings, AlertTriangle, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import styles from '@/styles/singer/PerformanceItem.module.css'
import SetlistManager from './SetlistManager'
import EditPerformanceModal from './EditPerformanceModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { getEffectiveStatus, formatLocalTime } from '@/utils/performance'
import { updatePerformanceStatus } from '@/services/singer'

// Dynamic MapPicker (Readonly)
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => {
        return <div className="h-[200px] w-full bg-gray-100 flex items-center justify-center text-gray-400">Loading...</div>
    },
    ssr: false
})

interface PerformanceItemProps {
    performance: any
    expanded: boolean
    onToggleExpand: () => void
    isPast: boolean
    allSongs: any[]
    onDelete?: () => void
    onRefresh?: () => void
}

export default function PerformanceItem({ performance: perf, expanded, onToggleExpand, isPast, allSongs, onDelete, onRefresh }: PerformanceItemProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const setlist = perf.songs || perf.performanceSongs?.map((ps: any) => ps.song) || []
    const [isSetlistEditing, setIsSetlistEditing] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Status Logic
    const getStatusInfo = () => {
        const effectiveStatus = getEffectiveStatus(perf)

        if (perf.status === 'canceled' || effectiveStatus === 'cancelled') return { key: 'canceled', style: styles.statusDefault }
        if (effectiveStatus === 'live') return { key: 'live', style: styles.statusLive }
        if (effectiveStatus === 'completed') return { key: 'completed', style: styles.statusDefault }

        return { key: 'scheduled', style: styles.statusScheduled }
    }

    const { key: statusKey, style: statusStyle } = getStatusInfo()

    const borderClass = statusKey === 'live' ? styles.borderLive : (statusKey === 'completed' || statusKey === 'canceled' ? styles.borderDefault : styles.borderScheduled)

    return (
        <div className={`${styles.card} ${borderClass}`}>
            <div
                className={styles.header}
                onClick={onToggleExpand}
            >
                <div>
                    <h3 className={styles.titleRow}>
                        {perf.title}
                        <span className={styles.badgeMap}>{t('performance.details.map_badge')}</span>
                        {statusKey === 'live' && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded animate-pulse">{t('common.live_badge')}</span>
                        )}
                    </h3>
                    <div className={styles.metaInfo}>
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                            <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                            <span>
                                {new Date(perf.startTime).toLocaleDateString()} <span className="mx-1">•</span>
                                {formatLocalTime(perf.startTime)}
                                {perf.endTime && (
                                    <>
                                        <span className="mx-1">-</span>
                                        {formatLocalTime(perf.endTime)}
                                    </>
                                )}
                            </span>
                        </div>
                        {perf.locationText && (
                            <div className="flex items-center text-gray-500 text-sm">
                                <MapPin className="w-4 h-4 mr-1.5 opacity-70" />
                                <span className="truncate max-w-[250px]">{perf.locationText}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-2">
                        {expanded ? (
                            <p className={styles.expandTrigger}>{t('performance.details.collapse_details')} <ChevronUp className="w-3 h-3 ml-1" /></p>
                        ) : (
                            <p className={styles.expandTrigger}>{t('performance.details.view_details')} <ChevronDown className="w-3 h-3 ml-1" /></p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`${styles.statusBadge} ${statusStyle}`}>
                        {t(`performance.status.${statusKey}`)}
                    </span>

                    {(statusKey === 'scheduled' || statusKey === 'live') && (
                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            {statusKey === 'scheduled' && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsEditing(true)
                                        }}
                                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition"
                                    >
                                        {t('performance.action.edit') || 'Edit'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (window.confirm(t('performance.list.confirm_cancel'))) {
                                                updatePerformanceStatus(perf.id, 'canceled').then(() => {
                                                    router.refresh()
                                                    onRefresh?.()
                                                })
                                            }
                                        }}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                                    >
                                        {t('performance.action.cancel') || 'Cancel'}
                                    </button>
                                </>
                            )}
                            {statusKey === 'live' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (window.confirm(t('performance.list.confirm_end'))) {
                                            updatePerformanceStatus(perf.id, 'completed').then(() => {
                                                router.refresh()
                                                onRefresh?.()
                                            })
                                        }
                                    }}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition font-bold"
                                >
                                    {t('performance.action.force_end') || 'End Performance'}
                                </button>
                            )}
                            {statusKey === 'scheduled' && onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                    title={t('performance.list.delete')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {expanded && (
                <div className={styles.expandedSection}>
                    {perf.locationLat && perf.locationLng && (
                        <div className={styles.mapSection}>
                            <h4 className={styles.sectionTitle}><MapPin className={styles.icon} /> {t('performance.details.location_map')}</h4>
                            <div className={styles.mapContainer}>
                                <MapPicker
                                    onLocationSelect={() => { }}
                                    initialLat={perf.locationLat}
                                    initialLng={perf.locationLng}
                                    readonly={true}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.setlistSection}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className={styles.sectionTitle}><Music className={styles.icon} /> {t('performance.details.setlist_title')} ({setlist.length})</h4>
                            {!isPast && (
                                <button
                                    onClick={() => setIsSetlistEditing(!isSetlistEditing)}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
                                >
                                    {isSetlistEditing ? t('performance.details.finish_editing') : t('performance.details.manage_setlist')}
                                </button>
                            )}
                        </div>

                        {isSetlistEditing ? (
                            <SetlistManager
                                performanceId={perf.id}
                                singerId={perf.singerId}
                                currentSongs={setlist}
                                allSongs={allSongs}
                                onUpdate={() => {
                                    router.refresh()
                                }}
                            />
                        ) : (
                            <>
                                {setlist.length > 0 ? (
                                    <ul className={styles.songList}>
                                        {setlist.map((song: any) => (
                                            <li key={song.id} className={styles.songItem}>
                                                <div>
                                                    <span className={styles.songTitle}>{song.title}</span>
                                                    <span className={styles.songArtist}>{song.artist}</span>
                                                </div>
                                                {song.youtubeUrl && (
                                                    <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className={styles.linkIcon}>
                                                        <LinkIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={styles.emptyMsg}>{t('performance.details.empty_setlist')}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {isEditing && (
                <EditPerformanceModal
                    performance={perf}
                    onClose={() => setIsEditing(false)}
                    onSuccess={() => {
                        setIsEditing(false)
                        router.refresh()
                        onRefresh?.()
                    }}
                />
            )}
        </div>
    )
}
