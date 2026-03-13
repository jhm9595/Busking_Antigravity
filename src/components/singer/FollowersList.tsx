
'use client'

import React, { useEffect, useState } from 'react'
import { Users, User } from 'lucide-react'

interface Follower {
    id: string
    nickname: string | null
    avatarUrl: string | null
}

interface FollowersListProps {
    singerId: string
}

export default function FollowersList({ singerId }: FollowersListProps) {
    const [followers, setFollowers] = useState<Follower[]>([])
    const [anonymousCount, setAnonymousCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!singerId) return
        async function fetchFollowers() {
            try {
                const res = await fetch(`/api/singers/${singerId}/followers`)
                if (res.ok) {
                    const data = await res.json()
                    setFollowers(data.followers)
                    setAnonymousCount(data.anonymousCount)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchFollowers()
    }, [singerId])

    if (loading) return <div className="text-gray-500 text-sm">Loading fans...</div>

    const total = followers.length + anonymousCount

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-foreground/70 uppercase tracking-widest">Total Fans</span>
                <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs px-3 py-1 rounded-full font-black">{total}</span>
            </div>

            {total === 0 ? (
                <p className="text-foreground/50 text-sm italic font-bold text-center py-8">No followers yet. Keep busking!</p>
            ) : (
                <div className="space-y-6">
                    {followers.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                            {followers.map(f => (
                                <div key={f.id} className="flex flex-col items-center group">
                                    <div className="w-12 h-12 rounded-full bg-foreground/5 overflow-hidden mb-2 border border-border group-hover:border-indigo-500 transition-colors">
                                        {f.avatarUrl ? (
                                            <img src={f.avatarUrl} alt={f.nickname || 'Fan'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-foreground/30">
                                                <User className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-foreground/70 font-bold truncate w-full text-center group-hover:text-indigo-500 transition-colors">{f.nickname || 'Fan'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {anonymousCount > 0 && (
                        <div className="flex items-center text-sm text-foreground/60 bg-foreground/5 p-4 rounded-2xl border border-dashed border-border">
                            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center mr-4 text-foreground/50 font-black text-xs ring-4 ring-background">
                                +{anonymousCount}
                            </div>
                            <span className="font-bold italic">Anonymous Fans (Guests)</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
