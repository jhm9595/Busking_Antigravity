'use client'

import React from 'react'
import SongItem from './SongItem'
import { useLanguage } from '@/contexts/LanguageContext'

interface SongListProps {
    songs: any[]
    loading: boolean
    onDeleteSong: (id: string) => void
}

export default function SongList({ songs, loading, onDeleteSong }: SongListProps) {
    const { t } = useLanguage()

    if (loading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                ))}
            </div>
        )
    }

    if (songs.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">{t('song.empty_list')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('song.empty_hint')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {songs.map((song) => (
                <SongItem
                    key={song.id}
                    song={song}
                    onDelete={onDeleteSong}
                />
            ))}
        </div>
    )
}
