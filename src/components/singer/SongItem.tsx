'use client'

import React, { useState } from 'react'
import { Trash2, Link as LinkIcon } from 'lucide-react'
import styles from '@/styles/singer/SongItem.module.css'

interface SongItemProps {
    song: any
    onDelete: (id: string) => void
}

export default function SongItem({ song, onDelete }: SongItemProps) {
    const [isConfirming, setIsConfirming] = useState(false)

    const handleDeleteClick = () => {
        if (isConfirming) {
            onDelete(song.id)
            setIsConfirming(false)
        } else {
            setIsConfirming(true)
            // Auto reset after 3 seconds
            setTimeout(() => setIsConfirming(false), 3000)
        }
    }

    return (
        <div className={styles.item}>
            <div className={styles.info}>
                <div className={styles.textContainer}>
                    <p className={styles.title}>{song.title}</p>
                    <p className={styles.artist}>{song.artist}</p>
                </div>
                {song.youtubeUrl && (
                    <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        <LinkIcon className="w-5 h-5" />
                    </a>
                )}
            </div>

            <div className={styles.actions}>
                <span className={styles.date}>
                    {new Date(song.createdAt).toLocaleDateString()}
                </span>
                <button
                    onClick={handleDeleteClick}
                    className={isConfirming ? styles.deleteButtonActive : styles.deleteButton}
                >
                    {isConfirming ? 'Confirm?' : <Trash2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}

