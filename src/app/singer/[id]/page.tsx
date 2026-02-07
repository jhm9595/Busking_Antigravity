'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Music, MapPin, Calendar, MessageCircle, Heart, Share2, Mail } from 'lucide-react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import BookingRequestModal from '@/components/audience/BookingRequestModal'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-800 text-gray-500">Loading Map...</div>,
    ssr: false
})

interface SingerData {
    id: string
    stageName: string
    fanCount: number
    isVerified: boolean
    performances: any[]
    bio?: string
}

interface SongData {
    id: string
    title: string
    artist: string
    youtubeUrl: string | null
    bio?: string | null
}

export default function SingerDetailPage() {
    const params = useParams()
    const { t } = useLanguage()
    const [singer, setSinger] = useState<SingerData | null>(null)
    const [songs, setSongs] = useState<SongData[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedPerfId, setExpandedPerfId] = useState<string | null>(null)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [isFollowed, setIsFollowed] = useState(false)

    useEffect(() => {
        async function fetchData() {
            if (!params.id) return
            const singerId = params.id as string

            try {
                // Fetch Singer and Performance Data
                // Note: We need to create this API endpoint
                const res = await fetch(`/api/singers/${singerId}`)
                if (!res.ok) throw new Error('Failed to fetch singer')
                const data = await res.json()
                setSinger(data)

                if (data.songs) {
                    setSongs(data.songs)
                }

                // Check Follow Status
                const storedFanId = localStorage.getItem('busking_fan_id') || `fan_${Math.random().toString(36).substr(2, 9)}`
                localStorage.setItem('busking_fan_id', storedFanId)

                const followRes = await fetch(`/api/singers/${singerId}/follow?fanId=${storedFanId}`)
                if (followRes.ok) {
                    const followData = await followRes.json()
                    setIsFollowed(followData.isFollowed)
                    // Update fan count from source of truth
                    setSinger(prev => prev ? { ...prev, fanCount: followData.fanCount } : null)
                }

            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [params.id])

    const handleFollow = async () => {
        if (!singer) return

        // Optimistic UI update
        const prevFollowed = isFollowed
        const prevCount = singer.fanCount

        setIsFollowed(!isFollowed)
        setSinger({ ...singer, fanCount: isFollowed ? singer.fanCount - 1 : singer.fanCount + 1 })

        const fanId = localStorage.getItem('busking_fan_id')
        if (!fanId) return

        try {
            const res = await fetch(`/api/singers/${singer.id}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fanId })
            })

            if (!res.ok) throw new Error('Failed to follow')

            const data = await res.json()
            // Sync with server state
            setIsFollowed(data.isFollowed)
            setSinger(prev => prev ? { ...prev, fanCount: data.fanCount } : null)

        } catch (error) {
            console.error(error)
            // Revert on error
            setIsFollowed(prevFollowed)
            setSinger(prev => prev ? { ...prev, fanCount: prevCount } : null)
            alert('Failed to update follow status')
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: singer?.stageName || 'Check out this busker!',
                    text: `Watch ${singer?.stageName} on BuskerKing!`,
                    url: window.location.href,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    const handleBookingSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    singerId: singer?.id,
                    ...data
                })
            })

            if (!res.ok) throw new Error('Booking failed')
            alert('Booking inquiry sent successfully!')
            setIsBookingModalOpen(false)
        } catch (error) {
            console.error('Booking Error:', error)
            alert('Failed to send booking request.')
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">{t('common.loading')}</div>
    if (!singer) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Artist not found</div>

    return (
        <div className="min-h-screen bg-neutral-900 text-white pb-20">
            {/* Header / Banner */}
            <div className="relative h-64 bg-gradient-to-b from-indigo-900 to-black">
                <div className="absolute top-4 right-4 z-10">
                    <LanguageSwitcher />
                </div>
                <div className="absolute -bottom-16 left-6">
                    <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-700 overflow-hidden shadow-2xl">
                        {/* Avatar Placeholder */}
                        <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-4xl font-bold">
                            {singer.stageName[0]}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20 px-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{singer.stageName}</h1>
                        <p className="text-gray-400 mt-1 flex items-center">
                            <Heart className={`w-4 h-4 mr-1 ${isFollowed ? 'text-red-500 fill-current' : 'text-gray-500'}`} /> {singer.fanCount} Fans
                        </p>
                        {singer.bio && (
                            <p className="text-gray-300 mt-3 text-sm leading-relaxed whitespace-pre-line max-w-md">
                                {singer.bio}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleShare}
                        className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-6">
                    <button
                        onClick={handleFollow}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg transition ${isFollowed
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                            }`}
                    >
                        {isFollowed ? 'Following' : 'Follow'}
                    </button>
                    <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition flex items-center justify-center"
                    >
                        <Mail className="w-5 h-5 mr-2" />
                        {t('booking.modal.title')}
                    </button>
                </div>
            </div>

            {/* Repertoire Section */}
            <div className="mt-8 px-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Music className="w-5 h-5 mr-2 text-indigo-400" /> {t('song.title')}
                </h2>
                <div className="space-y-3">
                    {songs.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('song.empty_list')}</p>
                    ) : (
                        songs.map(song => (
                            <div key={song.id} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-200">{song.title}</p>
                                    <p className="text-xs text-gray-400">{song.artist}</p>
                                </div>
                                {song.youtubeUrl && (
                                    <a href={song.youtubeUrl} target="_blank" className="text-red-400 text-xs border border-red-400/30 px-2 py-1 rounded hover:bg-red-400/10">
                                        Watch
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Live Now Section */}
            {singer.performances.some((p: any) => p.status === 'live') && (
                <div className="mt-8 px-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-red-500 animate-pulse">
                        <MessageCircle className="w-5 h-5 mr-2" /> {t('performance.status.live')}
                    </h2>
                    <div className="space-y-4">
                        {singer.performances
                            .filter((p: any) => p.status === 'live')
                            .map((perf: any) => (
                                <div key={perf.id} className="bg-gradient-to-r from-red-900/40 to-black border border-red-600/50 rounded-xl overflow-hidden shadow-lg shadow-red-900/20">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-white">{perf.title}</h3>
                                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
                                        </div>
                                        <p className="text-gray-300 text-sm mb-4">{perf.locationText}</p>

                                        <div className="flex space-x-2">
                                            <Link href={`/live/${perf.id}`} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg text-sm transition text-center flex items-center justify-center">
                                                Enter Live
                                            </Link>

                                            {/* End Button - Ideally should check if user is the singer, but adding for UX request */}
                                            <button
                                                onClick={async () => {
                                                    if (confirm(t('live.header.confirm_end'))) {
                                                        try {
                                                            await fetch('/api/performances/status', {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id: perf.id, status: 'completed' })
                                                            })
                                                            window.location.reload()
                                                        } catch (e) {
                                                            console.error(e)
                                                            alert('Error ending performance')
                                                        }
                                                    }
                                                }}
                                                className="px-4 bg-gray-800 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg font-bold text-xs"
                                            >
                                                End
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Schedule Section */}
            <div className="mt-8 px-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-green-400" /> {t('performance.upcoming')}
                </h2>
                <div className="space-y-4">
                    {singer.performances.filter((p: any) => p.status === 'scheduled').length === 0 ? (
                        <div className="p-4 bg-gray-800/30 rounded-lg text-center text-gray-400 text-sm">
                            {t('performance.list.empty_upcoming')}
                        </div>
                    ) : (
                        singer.performances
                            .filter((p: any) => p.status === 'scheduled')
                            .map((perf: any) => (
                                <div key={perf.id} className="bg-gradient-to-r from-gray-800 to-gray-800/80 border border-gray-700 rounded-xl overflow-hidden group">
                                    <div className="p-4 relative">
                                        <div className="absolute top-0 right-0 p-2 opacity-50">
                                            <MapPin className="w-12 h-12 text-gray-700" />
                                        </div>
                                        <h3 className="font-bold text-lg text-white relative z-10">{perf.title}</h3>
                                        <p className="text-gray-400 text-sm relative z-10">{perf.locationText}</p>
                                        <div className="mt-3 flex items-center text-xs text-gray-500 relative z-10">
                                            <span className="bg-gray-700 px-2 py-1 rounded mr-2 text-gray-300">
                                                {(() => {
                                                    try {
                                                        return new Date(perf.startTime).toLocaleDateString()
                                                    } catch (e) {
                                                        return 'Date Error'
                                                    }
                                                })()}
                                            </span>
                                            {perf.chatEnabled && (
                                                <span className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded flex items-center border border-indigo-700/50">
                                                    <MessageCircle className="w-3 h-3 mr-1" /> Chat Live
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex space-x-2 relative z-10">
                                            {perf.locationLat && perf.locationLng && (
                                                <button
                                                    onClick={() => setExpandedPerfId(expandedPerfId === perf.id ? null : perf.id)}
                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition flex items-center justify-center"
                                                >
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    {expandedPerfId === perf.id ? t('performance.form.map_hide') : t('performance.form.map_show')}
                                                </button>
                                            )}
                                            {perf.chatEnabled && perf.status === 'live' && (
                                                <Link href={`/live/${perf.id}`} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition shadow-lg shadow-green-900/20 text-center flex items-center justify-center">
                                                    Enter Chat
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Map View */}
                                    {expandedPerfId === perf.id && perf.locationLat && perf.locationLng && (
                                        <div className="p-4 bg-gray-900/50 border-t border-gray-700 h-64">
                                            <MapPicker
                                                onLocationSelect={() => { }}
                                                initialLat={perf.locationLat}
                                                initialLng={perf.locationLng}
                                                readonly={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            <BookingRequestModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onSubmit={handleBookingSubmit}
                singerName={singer.stageName}
            />
        </div>
    )
}
