'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import DateTimePicker from '@/components/common/DateTimePicker'
import styles from '@/styles/singer/PerformanceForm.module.css'
import SongSelector from './SongSelector'
import { addPerformance } from '@/services/singer'
import { useLanguage } from '@/contexts/LanguageContext'

// Dynamic MapPicker
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading...</div>,
    ssr: false
})

interface PerformanceFormProps {
    singerId: string
    allSongs: any[]
    onSuccess: () => void
}

export default function PerformanceForm({ singerId, allSongs, onSuccess }: PerformanceFormProps) {
    const { t } = useLanguage()

    const [newPerf, setNewPerf] = useState({
        title: '',
        location_text: '',
        lat: 0,
        lng: 0,
        start_time: '',
        end_time: '',
        chat_enabled: false,
        streaming_enabled: false,
        expected_audience: 50 as number | ''
    })

    const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
    const [showMap, setShowMap] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)


    // Initialize dates on client side to avoid hydration mismatch
    useEffect(() => {
        // We set empty strings to ensure user must pick them
        setNewPerf(prev => ({
            ...prev,
            start_time: '',
            end_time: ''
        }))
    }, [])

    const toggleSongSelection = (songId: string) => {
        setSelectedSongIds(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        )
    }

    const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
        setNewPerf(prev => {
            const isCurrentTextEmpty = prev.location_text.trim() === '';
            const newLocationText = (address && isCurrentTextEmpty) ? address : prev.location_text;
            return {
                ...prev,
                lat,
                lng,
                location_text: newLocationText
            };
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        if (!newPerf.start_time || !newPerf.end_time) {
            alert(t('performance.form.alert_times'))
            return
        }

        if (newPerf.end_time <= newPerf.start_time) {
            alert(t('performance.form.alert_order'))
            return
        }

        if (newPerf.chat_enabled) {
            const startMs = new Date(newPerf.start_time).getTime()
            const endMs = new Date(newPerf.end_time).getTime()
            const hours = Math.ceil((endMs - startMs) / (1000 * 60 * 60))
            const estimatedCost = hours * 1000 // 1000 KRW per hour

            // Using window.confirm for mock payment
            const confirmed = window.confirm(`채팅 서버 사용이 선택되었습니다. 예상 비용은 ${estimatedCost.toLocaleString()}원 입니다.\n(현재 오픈 베타 기간으로 실제 과금되진 않습니다.)\n진행하시겠습니까?`)
            if (!confirmed) return
        }

        setIsSubmitting(true)
        try {
            const result = await addPerformance({
                singerId,
                title: newPerf.title,
                locationText: newPerf.location_text,
                lat: newPerf.lat || undefined,
                lng: newPerf.lng || undefined,
                startTime: new Date(newPerf.start_time).toISOString(),
                endTime: new Date(newPerf.end_time).toISOString(),
                chatEnabled: newPerf.chat_enabled,
                streamingEnabled: newPerf.streaming_enabled,
                chatCost: 0,
                expectedAudience: newPerf.expected_audience === '' ? undefined : newPerf.expected_audience,
                songIds: selectedSongIds
            })

            if (result.success) {
                // Reset to empty
                setNewPerf({
                    title: '',
                    location_text: '',
                    lat: 0,
                    lng: 0,
                    start_time: '',
                    end_time: '',
                    chat_enabled: false,
                    streaming_enabled: false,
                    expected_audience: 50 as number | ''
                })
                setSelectedSongIds([])
                setShowMap(false)
                onSuccess()
            } else {
                const error = (result as any).error
                if (error === 'DUPLICATE_SCHEDULE') {
                    alert(t('performance.form.error_duplicate'))
                } else if (error === 'MIN_DURATION_NOT_MET') {
                    alert(t('performance.form.error_min_duration'))
                } else if (error === 'INVALID_DURATION') {
                    alert(t('performance.form.error_duration'))
                } else if (error === 'INSUFFICIENT_POINTS') {
                    alert(t('performance.form.error_insufficient_points'))
                } else {
                    alert(`${t('performance.form.error_submit')}\nReason: ${error}`)
                }
            }
        } catch (error: any) {
            console.error('Failed to register:', error)
            alert(`${t('performance.form.error_submit')}\nError: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }

    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.gridContainer}>
                {/* Title */}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>{t('performance.form.title')} <span className="text-red-500">*</span></label>
                    <input
                        required
                        placeholder={t('performance.form.title_placeholder')}
                        className={styles.input}
                        value={newPerf.title}
                        onChange={(e) => setNewPerf({ ...newPerf, title: e.target.value })}
                    />
                </div>



                {/* Location Input & Map Toggle */}
                <div className={styles.fieldGroup}>
                    <div className={styles.locationLabelRow}>
                        <label className={styles.label}>{t('performance.form.location')} <span className="text-red-500">*</span></label>
                        {newPerf.lat !== 0 && (
                            <span className={styles.locationCoords}>
                                {newPerf.lat.toFixed(4)}, {newPerf.lng.toFixed(4)}
                            </span>
                        )}
                    </div>
                    <div className={styles.locationInputRow}>
                        <input
                            required
                            placeholder={t('performance.form.location_placeholder')}
                            className={`${styles.input} ${styles.flexInput}`}
                            value={newPerf.location_text}
                            onChange={(e) => setNewPerf({ ...newPerf, location_text: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowMap(!showMap)}
                            className={styles.mapButton}
                            title={showMap ? t('performance.form.map_hide') : t('performance.form.map_show')}
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Leaflet Map Section */}
                {showMap && (
                    <div className={styles.mapWrapper}>
                        <MapPicker onLocationSelect={handleLocationSelect} initialLat={newPerf.lat || undefined} initialLng={newPerf.lng || undefined} />
                        <p className={styles.mapHelpText}>
                            {t('performance.form.map_help')}
                        </p>
                    </div>
                )}

                {/* Date Time Selection: Side-by-side on Desktop */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('performance.form.start_time')}</span>
                        </div>
                        <DateTimePicker
                            label=""
                            value={newPerf.start_time}
                            onChange={(val) => setNewPerf({ ...newPerf, start_time: val })}
                            required
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('performance.form.end_time')}</span>
                            <span className="text-[10px] font-black text-indigo-500 italic uppercase">{t('performance.form.time_hint')}</span>
                        </div>
                        <DateTimePicker
                            label=""
                            value={newPerf.end_time}
                            onChange={(val) => setNewPerf({ ...newPerf, end_time: val })}
                            required
                        />
                    </div>
                </div>

                <label className={`${styles.checkboxLabel} mb-4 block`}>
                    <input
                        type="checkbox"
                        checked={newPerf.streaming_enabled}
                        onChange={(e) => setNewPerf({ ...newPerf, streaming_enabled: e.target.checked })}
                        className={`${styles.checkbox} opacity-50 cursor-not-allowed`}
                        disabled
                    />
                    <span className={styles.checkboxText}>
                        {t('performance.form.enable_streaming')} <span className="text-red-500 text-xs font-bold ml-1">{t('performance.form.streaming_beta')}</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                        * {t('performance.form.streaming_help')}
                    </p>
                </label>

                {/* Chat Options */}
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={newPerf.chat_enabled}
                        onChange={(e) => setNewPerf({ ...newPerf, chat_enabled: e.target.checked })}
                        className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{t('performance.form.enable_chat')}</span>
                </label>
            </div>

            {newPerf.chat_enabled && (
                <div className={styles.chatCostSection}>
                    <label className={styles.chatCostLabel}>{t('performance.form.chat_capacity')}</label>
                    <input
                        type="number"
                        className={styles.chatCostInput}
                        placeholder="50"
                        value={newPerf.expected_audience === '' ? '' : newPerf.expected_audience}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNewPerf({ ...newPerf, expected_audience: val === '' ? '' : Number(val) });
                        }}
                    />
                    <p className={styles.chatCostHelp}>{t('performance.form.chat_capacity_help')}</p>
                </div>
            )}

            {/* Song Selection using Reusable Component */}
            <SongSelector
                songs={allSongs}
                selectedSongIds={selectedSongIds}
                onToggle={toggleSongSelection}
            />

            <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
            >
                {isSubmitting ? t('performance.form.registering') : t('performance.form.register')}
            </button>
        </form>
    )
}
