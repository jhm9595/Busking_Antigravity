'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { addSong } from '@/services/singer'
import styles from '@/styles/singer/SongInputForm.module.css'
import { useLanguage } from '@/contexts/LanguageContext'

interface SongInputFormProps {
    singerId: string
    onSuccess: () => void
}

export default function SongInputForm({ singerId, onSuccess }: SongInputFormProps) {
    const { t } = useLanguage()
    const [newSong, setNewSong] = useState({ title: '', artist: '', youtube_url: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (keep existing logic, lines 18-38)
        e.preventDefault()
        if (!singerId) return

        setIsSubmitting(true)
        try {
            await addSong({
                singerId: singerId,
                title: newSong.title,
                artist: newSong.artist,
                youtubeUrl: newSong.youtube_url
            })

            setNewSong({ title: '', artist: '', youtube_url: '' })
            onSuccess()
        } catch (error) {
            console.error('Failed to add song:', error)
            alert('Failed to add song')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Top Row: Title & Artist */}
            <div className={styles.mainRow}>
                <input
                    required
                    placeholder={`${t('song.input.title')} *`}
                    className={styles.input}
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                />
                <input
                    required
                    placeholder={`${t('song.input.artist')} *`}
                    className={styles.input}
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                />
            </div>

            {/* Bottom Row: URL & Button */}
            <div className={styles.bottomRow}>
                <input
                    placeholder={t('song.input.url')}
                    className={`${styles.input} ${styles.urlInput}`}
                    value={newSong.youtube_url}
                    onChange={(e) => setNewSong({ ...newSong, youtube_url: e.target.value })}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.button}
                    title={t('song.input.add')}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </form>
    )
}
