'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
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
        e.preventDefault()
        if (!singerId) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    singerId,
                    title: newSong.title,
                    artist: newSong.artist,
                    youtubeUrl: newSong.youtube_url
                })
            })

            if (!res.ok) {
                throw new Error('Failed to add song')
            }

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
            {/* Top Row: Title & Artist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                    required
                    placeholder={`${t('song.input.title')} *`}
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                />
                <input
                    required
                    placeholder={`${t('song.input.artist')} *`}
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                />
            </div>

            {/* Bottom Row: URL & Button */}
            <div className="flex gap-2 items-center w-full">
                <input
                    placeholder={t('song.input.url')}
                    className="flex-1 min-w-0 px-4 py-3 bg-background border border-input rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={newSong.youtube_url}
                    onChange={(e) => setNewSong({ ...newSong, youtube_url: e.target.value })}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('song.input.add')}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </form>
    )
}
