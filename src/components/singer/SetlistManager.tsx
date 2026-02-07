'use client'

import React, { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus, Save, ListMusic } from 'lucide-react'
import styles from '@/styles/singer/SetlistManager.module.css'
import { updatePerformanceSetlist } from '@/services/singer'

import { useLanguage } from '@/contexts/LanguageContext'

interface SetlistManagerProps {
    performanceId: string
    singerId: string
    currentSongs: any[]
    allSongs: any[]
    onUpdate: () => void
}

export default function SetlistManager({ performanceId, singerId, currentSongs, allSongs, onUpdate }: SetlistManagerProps) {
    const { t } = useLanguage()
    // Local state for immediate UI feedback
    const [songs, setSongs] = useState<any[]>(currentSongs)
    const [selectedSongId, setSelectedSongId] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Filter out songs already in the setlist
    const availableSongs = allSongs.filter(s => !songs.find(existing => existing.id === s.id))

    const handleAddSong = () => {
        if (!selectedSongId) return
        const songToAdd = allSongs.find(s => s.id === selectedSongId)
        if (songToAdd) {
            setSongs([...songs, songToAdd])
            setSelectedSongId('')
        }
    }

    const handleRemoveSong = (index: number) => {
        const newSongs = [...songs]
        newSongs.splice(index, 1)
        setSongs(newSongs)
    }

    const moveSong = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === songs.length - 1) return

        const newSongs = [...songs]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const [movedSong] = newSongs.splice(index, 1)
        newSongs.splice(targetIndex, 0, movedSong)
        setSongs(newSongs)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updatePerformanceSetlist({
                performanceId,
                singerId,
                songIds: songs.map(s => s.id)
            })
            onUpdate()
            alert('Setlist updated successfully!')
        } catch (error) {
            console.error('Failed to update setlist:', error)
            alert('Failed to update setlist')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={styles.container}>
            {/* Redundant header removed to avoid duplication with parent component */}
            <div className="flex justify-end mb-2">
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                    {songs.length} {t('performance.details.songs_badge')}
                </span>
            </div>

            <div className={styles.list}>
                {songs.length === 0 ? (
                    <p className={styles.empty}>{t('performance.details.empty_setlist')}</p>
                ) : (
                    songs.map((song, index) => (
                        <div key={`${song.id}-${index}`} className={styles.item}>
                            <div className={styles.itemInfo}>
                                <span className="text-gray-500 mr-2 font-mono text-xs">{index + 1}</span>
                                <span className={styles.songTitle}>{song.title}</span>
                                <span className={styles.songArtist}>{song.artist}</span>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    onClick={() => moveSong(index, 'up')}
                                    disabled={index === 0}
                                    className={`${styles.actionBtn} disabled:opacity-30`}
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveSong(index, 'down')}
                                    disabled={index === songs.length - 1}
                                    className={`${styles.actionBtn} disabled:opacity-30`}
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleRemoveSong(index)}
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.addSection}>
                <div className="flex gap-2 mb-3 items-center">
                    <select
                        className={styles.select}
                        value={selectedSongId}
                        onChange={(e) => setSelectedSongId(e.target.value)}
                        style={{ color: selectedSongId ? '#000' : '#4f46e5' }} // Highlight placeholder text in indigo to show interactivity
                    >
                        <option value="" className="text-gray-500">{t('song.select_placeholder')}</option>
                        {availableSongs.map(song => (
                            <option key={song.id} value={song.id} className="text-black">
                                {song.title} - {song.artist}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddSong}
                        className="bg-green-100 text-green-700 px-4 rounded hover:bg-green-200 transition-colors h-[46px] flex items-center justify-center border border-green-200"
                        disabled={!selectedSongId}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={styles.saveBtn}
                >
                    {isSaving ? t('common.loading') : t('common.save')}
                </button>
            </div>
        </div>
    )
}
