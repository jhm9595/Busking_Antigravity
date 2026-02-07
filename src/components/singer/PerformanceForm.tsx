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
        expected_audience: 50
    })

    const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
    const [showMap, setShowMap] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper to calculate default times (Next full hour)
    const getDefaultTimes = () => {
        const now = new Date()
        now.setMinutes(0, 0, 0)
        now.setHours(now.getHours() + 1) // Next hour

        const start = new Date(now)
        const end = new Date(now)
        end.setHours(end.getHours() + 1) // +1 hour duration

        const toLocalISO = (d: Date) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)

        return {
            start_time: toLocalISO(start),
            end_time: toLocalISO(end)
        }
    }

    // Initialize dates on client side to avoid hydration mismatch
    useEffect(() => {
        const defaults = getDefaultTimes()
        setNewPerf(prev => ({
            ...prev,
            start_time: defaults.start_time,
            end_time: defaults.end_time
        }))
    }, [])

    const toggleSongSelection = (songId: string) => {
        setSelectedSongIds(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        )
    }

    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        setNewPerf(prev => ({ ...prev, lat, lng }))
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

        setIsSubmitting(true)
        try {
            await addPerformance({
                singerId,
                title: newPerf.title,
                locationText: newPerf.location_text,
                lat: newPerf.lat || undefined,
                lng: newPerf.lng || undefined,
                startTime: newPerf.start_time,
                endTime: newPerf.end_time,
                chatEnabled: newPerf.chat_enabled,
                streamingEnabled: newPerf.streaming_enabled,
                chatCost: 0,
                expectedAudience: newPerf.expected_audience,
                songIds: selectedSongIds
            })

            // Reset with default times
            const defaults = getDefaultTimes()
            setNewPerf({
                title: '',
                location_text: '',
                lat: 0,
                lng: 0,
                start_time: defaults.start_time,
                end_time: defaults.end_time,
                chat_enabled: false,
                streaming_enabled: false,
                expected_audience: 50
            })
            setSelectedSongIds([])
            setShowMap(false)
            onSuccess()
        } catch (error) {
            console.error('Failed to register:', error)
            alert(t('performance.form.error_submit'))
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

                {/* Date Time Selection using Reusable Component */}
                <DateTimePicker
                    label={t('performance.form.start_time')}
                    value={newPerf.start_time}
                    onChange={(val) => {
                        const startDate = new Date(val);
                        if (!isNaN(startDate.getTime())) {
                            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
                            // Format to datetime-local string: YYYY-MM-DDTHH:mm
                            const endStr = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                            setNewPerf({ ...newPerf, start_time: val, end_time: endStr });
                        } else {
                            setNewPerf({ ...newPerf, start_time: val });
                        }
                    }}
                    required
                />
                <DateTimePicker
                    label={t('performance.form.end_time')}
                    value={newPerf.end_time}
                    onChange={(val) => setNewPerf({ ...newPerf, end_time: val })}
                    required
                />

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
                        value={newPerf.expected_audience}
                        onChange={(e) => setNewPerf({ ...newPerf, expected_audience: Number(e.target.value) })}
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
