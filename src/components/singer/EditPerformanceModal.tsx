'use client'

import React, { useState, useCallback } from 'react'
import { MapPin, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import DateTimePicker from '@/components/common/DateTimePicker'
import styles from '@/styles/singer/PerformanceForm.module.css'
import { updatePerformance } from '@/services/singer'
import { useLanguage } from '@/contexts/LanguageContext'

const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-[300px] w-full animate-pulse flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>Loading Map...</div>,
    ssr: false
})

interface EditPerformanceModalProps {
    performance: any
    onClose: () => void
    onSuccess: () => void
}

export default function EditPerformanceModal({ performance, onClose, onSuccess }: EditPerformanceModalProps) {
    const { t } = useLanguage()

    // Convert performance start and end times to correct local strings
    const toLocalISO = (d: Date | string) => {
        const date = new Date(d)
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    }

    const [editPerf, setEditPerf] = useState({
        title: performance.title || '',
        location_text: performance.locationText || '',
        lat: performance.locationLat || 0,
        lng: performance.locationLng || 0,
        start_time: performance.startTime ? toLocalISO(performance.startTime) : '',
        end_time: performance.endTime ? toLocalISO(performance.endTime) : '',
        chat_enabled: performance.chatEnabled || false,
        streaming_enabled: performance.streamingEnabled || false,
    })

    const [showMap, setShowMap] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
        setEditPerf(prev => {
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

        const startTimeObj = new Date(editPerf.start_time)
        const endTimeObj = new Date(editPerf.end_time)

        if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
            alert(t('performance.form.alert_times'))
            return
        }

        if (endTimeObj <= startTimeObj) {
            alert(t('performance.form.error_duration'))
            return
        }

        setIsSubmitting(true)
        try {
            const result = await updatePerformance({
                id: performance.id,
                singerId: performance.singerId,
                title: editPerf.title,
                locationText: editPerf.location_text,
                lat: editPerf.lat || undefined,
                lng: editPerf.lng || undefined,
                startTime: startTimeObj.toISOString(),
                endTime: endTimeObj.toISOString()
            })

            if (result.success) {
                onSuccess()
            } else {
                alert(t('performance.form.error_submit'))
            }
        } catch (error: any) {
            console.error('Failed to update performance:', error)
            alert(`${t('performance.form.error_submit')}\nError: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" style={{ backgroundColor: 'var(--color-card)' }}>
                <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center z-10" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('performance.action.edit') || 'Edit Performance'}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                        {/* Title */}
                        <div className={`${styles.fieldGroup} col-span-1 md:col-span-2`}>
                            <label className={styles.label}>{t('performance.form.title')} <span className="text-red-500">*</span></label>
                            <input
                                required
                                placeholder={t('performance.form.title_placeholder')}
                                className={styles.input}
                                value={editPerf.title}
                                onChange={(e) => setEditPerf({ ...editPerf, title: e.target.value })}
                            />
                        </div>

                        {/* Location */}
                        <div className={`${styles.fieldGroup} col-span-1 md:col-span-2`}>
                            <div className={styles.locationLabelRow}>
                                <label className={styles.label}>{t('performance.form.location')} <span className="text-red-500">*</span></label>
                                {editPerf.lat !== 0 && (
                                    <span className={styles.locationCoords}>
                                        {editPerf.lat.toFixed(4)}, {editPerf.lng.toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <div className={styles.locationInputRow}>
                                <input
                                    required
                                    placeholder={t('performance.form.location_placeholder')}
                                    className={`${styles.input} ${styles.flexInput}`}
                                    value={editPerf.location_text}
                                    onChange={(e) => setEditPerf({ ...editPerf, location_text: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMap(!showMap)}
                                    className="p-3 rounded-lg flex-shrink-0 transition-colors"
                                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                                    title={showMap ? t('performance.form.map_hide') : t('performance.form.map_show')}
                                >
                                    <MapPin className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Map Section */}
                        {showMap && (
                            <div className="col-span-1 md:col-span-2 mb-4 -mx-1 border rounded-lg overflow-hidden">
                                <div className="p-2 text-sm border-b" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                                    {t('performance.form.map_help')}
                                </div>
                                <MapPicker onLocationSelect={handleLocationSelect} initialLat={editPerf.lat || undefined} initialLng={editPerf.lng || undefined} />
                            </div>
                        )}

                        {/* Date Time Selection */}
                        <div className="col-span-1">
                            <DateTimePicker
                                label={t('performance.form.start_time')}
                                value={editPerf.start_time}
                                onChange={(val) => setEditPerf({ ...editPerf, start_time: val })}
                                required
                            />
                        </div>
                        <div className="col-span-1">
                            <DateTimePicker
                                label={t('performance.form.end_time')}
                                value={editPerf.end_time}
                                onChange={(val) => setEditPerf({ ...editPerf, end_time: val })}
                                required
                            />
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:absolute mt-auto flex justify-end gap-3 z-20">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {isSubmitting ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
