import React from 'react'
import styles from '@/styles/singer/SongSelector.module.css'
import { useLanguage } from '@/contexts/LanguageContext'

interface Song {
    id: string
    title: string
    artist: string
    youtubeUrl?: string | null
}

interface SongSelectorProps {
    songs: Song[]
    selectedSongIds: string[]
    onToggle: (id: string) => void
    required?: boolean
    errorMessage?: string | null
}

export default function SongSelector({ songs, selectedSongIds, onToggle, required = false, errorMessage = null }: SongSelectorProps) {
    const { t } = useLanguage()

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>
                <span className={styles.titleLabel}>
                    <span>{t('song.list_title')}</span>
                    {required ? <span className={styles.requiredMark}>*</span> : null}
                </span>
                <span className={styles.selectionCount}>{selectedSongIds.length} {t('song.selected')}</span>
            </h3>
            <div className={styles.list}>
                {songs.length === 0 ? (
                    <p className={styles.emptyText}>{t('song.empty_list')}</p>
                ) : (
                    songs.map(song => (
                        <label key={song.id} className={styles.itemLabel}>
                            <input
                                type="checkbox"
                                checked={selectedSongIds.includes(song.id)}
                                onChange={() => onToggle(song.id)}
                                className={styles.checkbox}
                            />
                            <span className={styles.songTitle}>{song.title}</span>
                            <span className={styles.songArtist}>{song.artist}</span>
                        </label>
                    ))
                )}
            </div>
            {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}
        </div>
    )
}

