'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MapPin, HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import styles from '@/styles/singer/PerformanceForm.module.css'
import SongSelector from './SongSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { DateTimeInputField, RequiredMark, TextInputField } from '@/components/common/FormFields'

// Dynamic MapPicker
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-[300px] w-full bg-[var(--color-surface)] animate-pulse flex items-center justify-center text-[var(--color-text-muted)]">Loading Map...</div>,
    ssr: false
})

interface PerformanceFormProps {
    singerId: string
    allSongs: any[]
    availablePoints: number
    onSuccess: () => void
}

export default function PerformanceForm({ singerId, allSongs, availablePoints, onSuccess }: PerformanceFormProps) {
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
    const [costPreview, setCostPreview] = useState(0)
    const [songSelectionError, setSongSelectionError] = useState<string | null>(null)

    const hasInsufficientPoints = costPreview > 0 && availablePoints < costPreview

    // Initialize dates on client side to avoid hydration mismatch
    useEffect(() => {
        setNewPerf(prev => ({
            ...prev,
            start_time: '',
            end_time: ''
        }))
    }, [])

    // Calculate cost preview when times change
    useEffect(() => {
        if (newPerf.start_time && newPerf.end_time) {
            const start = new Date(newPerf.start_time).getTime()
            const end = new Date(newPerf.end_time).getTime()
            if (end > start) {
                const hours = Math.ceil((end - start) / (1000 * 60 * 60))
                setCostPreview(hours * 1000)
            } else {
                setCostPreview(0)
            }
        } else {
            setCostPreview(0)
        }
    }, [newPerf.start_time, newPerf.end_time])

    const toggleSongSelection = (songId: string) => {
        setSongSelectionError(null)
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

        const trimmedTitle = newPerf.title.trim()
        const trimmedLocation = newPerf.location_text.trim()

        if (!trimmedTitle) {
            alert(`${t('performance.form.title')} ${t('common.required')}`)
            return
        }

        if (!trimmedLocation) {
            alert(`${t('performance.form.location')} ${t('common.required')}`)
            return
        }

        if (!newPerf.start_time) {
            alert(`${t('performance.form.start_time')} ${t('common.required')}`)
            return
        }

        if (!newPerf.end_time) {
            alert(`${t('performance.form.end_time')} ${t('common.required')}`)
            return
        }

        if (selectedSongIds.length === 0) {
            const message = `${t('song.list_title')} ${t('common.required')}`
            setSongSelectionError(message)
            alert(message)
            return
        }

        const startTimeObj = new Date(newPerf.start_time)
        const endTimeObj = new Date(newPerf.end_time)

        if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
            alert(t('performance.form.alert_times'))
            return
        }

        if (endTimeObj <= startTimeObj) {
            alert(t('performance.form.error_duration'))
            return
        }

        const durationHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60)
        if (durationHours < 1) {
            alert(t('performance.form.error_min_duration'))
            return
        }

        const billableHours = Math.ceil(durationHours)
        const totalCost = billableHours * 1000

        if (availablePoints < totalCost) {
            alert(t('performance.form.error_insufficient_points'))
            return
        }

        const confirmMsg = t('performance.form.confirm_payment').replace('{points}', totalCost.toLocaleString())
        if (!window.confirm(confirmMsg)) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/performances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    singerId,
                    title: trimmedTitle,
                    locationText: trimmedLocation,
                    lat: newPerf.lat || undefined,
                    lng: newPerf.lng || undefined,
                    startTime: startTimeObj.toISOString(),
                    endTime: endTimeObj.toISOString(),
                    chatEnabled: newPerf.chat_enabled,
                    streamingEnabled: newPerf.streaming_enabled,
                    songIds: selectedSongIds
                })
            })

            const result = await response.json()

            if (result.success) {
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
                const error = result.error
                if (error === 'DUPLICATE_SCHEDULE') {
                    alert(t('performance.form.error_duplicate'))
                } else if (error === 'MIN_DURATION_NOT_MET') {
                    alert(t('performance.form.error_min_duration'))
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
                <div className={styles.fieldGroup}>
                    <TextInputField
                        label={t('performance.form.title')}
                        required
                        placeholder={t('performance.form.title_placeholder')}
                        value={newPerf.title}
                        onChange={(e) => setNewPerf({ ...newPerf, title: e.target.value })}
                        style={{
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                        }}
                    />
                </div>

                <div className={styles.fieldGroup}>
                    <div className={styles.locationLabelRow}>
                        <label className={styles.label}>{t('performance.form.location')} <RequiredMark /></label>
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

                {showMap && (
                    <div className={styles.mapWrapper}>
                        <MapPicker onLocationSelect={handleLocationSelect} initialLat={newPerf.lat || undefined} initialLng={newPerf.lng || undefined} />
                        <p className={styles.mapHelpText}>{t('performance.form.map_help')}</p>
                    </div>
                )}

                {/* Time fields - inline on desktop */}
                <div className={styles.timeFieldsRow}>
                    <div className={`${styles.fieldGroup} flex-1 min-w-0`}>
                        <DateTimeInputField
                            label={t('performance.form.start_time')}
                            value={newPerf.start_time}
                            onChange={(val) => setNewPerf({ ...newPerf, start_time: val })}
                            required
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
                        />
                    </div>
                    <div className={`${styles.fieldGroup} flex-1 min-w-0`}>
                        <div className={styles.inlineLabelRow}>
                            <label className={styles.label}>{t('performance.form.end_time')} <RequiredMark /></label>
                            <span className="text-[var(--color-text-muted)] cursor-help" title={t('performance.form.time_hint')}>
                                <HelpCircle className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <DateTimeInputField
                            label=""
                            value={newPerf.end_time}
                            onChange={(val) => setNewPerf({ ...newPerf, end_time: val })}
                            required
                            style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
                        />
                    </div>
                </div>

{/* Streaming option hidden - will be implemented later */}
                {/* 
                <label className={`${styles.checkboxLabel} mb-4 block`}>
                    <input
                        type="checkbox"
                        checked={newPerf.streaming_enabled}
                        className={`${styles.checkbox} opacity-50 cursor-not-allowed`}
                        disabled
                    />
                    <span className={styles.checkboxText}>
                        {t('performance.form.enable_streaming')} <span className="text-red-500 text-xs font-bold ml-1">{t('performance.form.streaming_beta')}</span>
                    </span>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 ml-6">* {t('performance.form.streaming_help')}</p>
                </label>
                */}

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

            <SongSelector
                songs={allSongs}
                selectedSongIds={selectedSongIds}
                onToggle={toggleSongSelection}
                required
                errorMessage={songSelectionError}
            />

            <button
                type="submit"
                disabled={isSubmitting || hasInsufficientPoints}
                className={styles.submitButton}
            >
                <div className="flex flex-col items-center justify-center">
                    <span>{isSubmitting ? t('performance.form.registering') : t('performance.form.register')}</span>
                    {!isSubmitting && costPreview > 0 && (
                        <span className="text-[10px] opacity-70 font-normal mt-0.5">
                            ({costPreview.toLocaleString()}P 소모)
                        </span>
                    )}
                </div>
            </button>
            {costPreview > 0 && (
                <div className="text-sm text-center space-y-1">
                    <p className="text-[var(--color-text-muted)]">
                        {t('performance.form.available_points').replace('{points}', availablePoints.toLocaleString())}
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                        {t('performance.form.required_points').replace('{points}', costPreview.toLocaleString())}
                    </p>
                    {hasInsufficientPoints && (
                        <p className="font-bold text-red-500">{t('performance.form.error_insufficient_points')}</p>
                    )}
                </div>
            )}
        </form>
    )
}
