
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
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                My Fans <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">{total}</span>
            </h3>

            {total === 0 ? (
                <p className="text-gray-500 text-sm">No followers yet. Keep busking!</p>
            ) : (
                <div className="space-y-4">
                    {followers.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                            {followers.map(f => (
                                <div key={f.id} className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mb-1 border border-gray-300">
                                        {f.avatarUrl ? (
                                            <img src={f.avatarUrl} alt={f.nickname || 'Fan'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <User className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-600 truncate w-full text-center">{f.nickname || 'Fan'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {anonymousCount > 0 && (
                        <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-400 font-bold text-xs ring-4 ring-white">
                                +{anonymousCount}
                            </div>
                            <span>Anonymous Fans (Guests)</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
