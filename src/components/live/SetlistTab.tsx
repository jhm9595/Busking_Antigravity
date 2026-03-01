import React from 'react'
import { Music, Plus, List, GripVertical } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface DeleteSongButtonProps {
    songId: string;
    onRemove: (id: string) => Promise<void>;
}

// Ensure DeleteSongButton is available locally or imported.
// For simplicity, we can just define it here.
import { Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

function DeleteSongButton({ songId, onRemove }: DeleteSongButtonProps) {
    const { t } = useLanguage()
    const [confirming, setConfirming] = useState(false)
    const [removing, setRemoving] = useState(false)

    useEffect(() => {
        if (!confirming) return
        const timer = setTimeout(() => setConfirming(false), 2000)
        return () => clearTimeout(timer)
    }, [confirming])

    const handleClick = async () => {
        if (!confirming) {
            setConfirming(true)
            return
        }
        setRemoving(true)
        await onRemove(songId)
        setRemoving(false)
        setConfirming(false)
    }

    if (removing) {
        return (
            <button disabled className="p-1.5 rounded-lg bg-red-900/30 text-red-500 opacity-50">
                <Trash2 className="w-4 h-4 animate-pulse" />
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            title={confirming ? t('common.confirm') : t('live.setlist.remove')}
            className={`p-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 ${confirming
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-700/60 text-gray-500 hover:bg-red-900/40 hover:text-red-400'
                }`}
        >
            <Trash2 className="w-4 h-4" />
            {confirming && <span>{t('common.confirm') || "Sure?"}</span>}
        </button>
    )
}

interface SetlistTabProps {
    songs: any[];
    isReordering: boolean;
    setIsReordering: (val: boolean) => void;
    setShowAddModal: (val: boolean) => void;
    onDragEnd: (result: DropResult) => void;
    handleToggleSongStatus: (songId: string, currentStatus: string) => void;
    togglingStatusIds: Set<string>;
    handleRemoveSong: (songId: string) => Promise<void>;
}

export default function SetlistTab({
    songs,
    isReordering,
    setIsReordering,
    setShowAddModal,
    onDragEnd,
    handleToggleSongStatus,
    togglingStatusIds,
    handleRemoveSong
}: SetlistTabProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">
                    {isReordering ? 'Use arrows to reorder' : t('live.setlist.reorder_hint')}
                </p>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsReordering(!isReordering)}
                        className={`p-2 rounded-lg ${isReordering ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {songs.length === 0 ? (
                <div className="p-8 text-center text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('live.setlist.empty')}</p>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="setlist">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {songs.map((song: any, index: number) => (
                                    <Draggable key={song.id} draggableId={song.id} index={index} isDragDisabled={!isReordering}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`bg-gray-800/80 p-3 rounded-xl flex items-center justify-between border border-gray-700 transition group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 z-50 bg-gray-700 scale-[1.02]' : 'hover:bg-gray-700'}`}
                                            >
                                                <div className="flex items-center flex-1 min-w-0" {...(isReordering ? provided.dragHandleProps : {})}>
                                                    {isReordering ? (
                                                        <GripVertical className="w-5 h-5 text-gray-400 hover:text-white mr-3 cursor-grab" />
                                                    ) : (
                                                        <span className={`text-indigo-500 font-mono mr-3 w-6 text-center text-lg font-bold ${song.status === 'completed' ? 'opacity-30' : ''}`}>{index + 1}</span>
                                                    )}
                                                    <div className={`truncate ${song.status === 'completed' ? 'opacity-30 line-through' : ''}`}>
                                                        <h3 className="text-white font-bold text-lg truncate pr-2">{song.title}</h3>
                                                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {!isReordering && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleSongStatus(song.id, song.status)}
                                                                disabled={togglingStatusIds.has(song.id)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${togglingStatusIds.has(song.id)
                                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-70'
                                                                    : song.status === 'completed'
                                                                        ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                                        : 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30'
                                                                    }`}
                                                            >
                                                                {togglingStatusIds.has(song.id) ? (
                                                                    <>
                                                                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                                        </svg>
                                                                        <span>...</span>
                                                                    </>
                                                                ) : (
                                                                    song.status === 'completed' ? 'Undo' : 'Complete'
                                                                )}
                                                            </button>
                                                            {song.youtubeUrl && (
                                                                <a href={song.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs bg-red-900/30 text-red-400 px-2 py-1.5 rounded border border-red-900/50 whitespace-nowrap">
                                                                    YT
                                                                </a>
                                                            )}
                                                            <DeleteSongButton songId={song.id} onRemove={handleRemoveSong} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            <div className="text-center pt-4">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center text-indigo-400 font-bold hover:text-indigo-300"
                >
                    <Plus className="w-5 h-5 mr-1" /> {t('live.setlist.add_button')}
                </button>
            </div>
        </div>
    )
}
