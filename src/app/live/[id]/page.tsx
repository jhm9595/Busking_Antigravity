'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatBox from '@/components/chat/ChatBox'
import { getPerformanceById, createSongRequest } from '@/services/singer'
import AvatarCreator from '@/components/audience/AvatarCreator'
import { AvatarConfig } from '@/components/audience/PixelAvatar'
import SongRequestModal from '@/components/audience/SongRequestModal'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { Music, MessageSquare, Video, Info, Instagram, Twitter, Facebook, ExternalLink, Calendar } from 'lucide-react'
import { createBookingRequest, getSinger } from '@/services/singer'
import Link from 'next/link'
import PixelAvatar from '@/components/audience/PixelAvatar'

export default function AudienceLivePage() {
    const params = useParams()
    const performanceId = params.id as string
    const [performance, setPerformance] = useState<any>(null)
    const [username, setUsername] = useState('')

    const [userType, setUserType] = useState<'anon' | 'named'>('named')
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'chat' | 'setlist' | 'info'>('chat')
    const [singer, setSinger] = useState<any>(null)

    const handleSongRequest = async (title: string, artist: string) => {
        if (!performanceId) return
        try {
            await createSongRequest({
                performanceId,
                title,
                artist
            })

            // Notify via socket if connected
            if (activeSocket) {
                activeSocket.emit('song_requested', { performanceId, title, username })
            }

            alert('Your song request has been sent!')
        } catch (error) {
            console.error(error)
            alert('Failed to send request.')
        }
    }

    const [activeSocket, setActiveSocket] = useState<any>(null)

    useEffect(() => {
        if (performanceId) {
            getPerformanceById(performanceId).then(p => {
                setPerformance(p)
                if (p?.singerId) {
                    getSinger(p.singerId).then(setSinger)
                }
            })
        }
    }, [performanceId])

    const handleBookingRequest = async (data: any) => {
        if (!performance?.singerId) return
        await createBookingRequest({
            singerId: performance.singerId,
            ...data
        })
        alert('Booking enquiry sent! The singer will contact you soon.')
    }

    if (!username) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white p-4">
                <AvatarCreator
                    onComplete={(name, config, type) => {
                        setUsername(name)
                        setAvatarConfig(config)
                        setUserType(type)
                    }}
                />
            </div>
        )
    }

    if (!performance) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Performance...</div>

    return (
        <div className="h-screen flex flex-col bg-black text-white">
            <header className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center shadow-lg z-10">
                <div>
                    <h1 className="text-lg font-bold text-white">{performance.title}</h1>
                    <p className="text-xs text-indigo-400 font-mono">LIVE • {performance.locationText || 'Online'}</p>
                </div>
                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                    ON AIR
                </div>
            </header>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Live Stream Placeholder - Reserved Area */}
                {/* Live Stream Placeholder - Only if enabled */}
                {performance.streamingEnabled && (
                    <div className="bg-black/50 border-b border-gray-800 p-4 flex items-center justify-center h-[160px] shrink-0 bg-[url('https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80')] bg-cover bg-center">
                        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-gray-600 flex flex-col items-center shadow-2xl text-center">
                            <div className="flex items-center mb-2">
                                <Video className="w-5 h-5 mr-2 text-yellow-500" />
                                <span className="text-sm font-bold text-white">Live Stream <span className="text-yellow-500 bg-yellow-900/40 px-1.5 py-0.5 rounded text-[10px] ml-1">BETA</span></span>
                            </div>
                            <p className="text-xs text-gray-300">
                                This feature is currently under preparation.<br />
                                <span className="opacity-75">Please enjoy the Audio & Chat!</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-gray-900 border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition ${activeTab === 'chat' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-800' : 'text-gray-500'}`}
                    >
                        <MessageSquare className="w-4 h-4 mr-1.5" /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('setlist')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition ${activeTab === 'setlist' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-800' : 'text-gray-500'}`}
                    >
                        <Music className="w-4 h-4 mr-1.5" /> Setlist
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center transition ${activeTab === 'info' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-800' : 'text-gray-500'}`}
                    >
                        <Info className="w-4 h-4 mr-1.5" /> Info
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'chat' ? (
                        <div className="flex flex-col h-full bg-gray-900">
                            {/* Floating Song Request Button for easy access */}
                            <div className="flex-1 relative overflow-hidden">
                                <ChatBox
                                    performanceId={performanceId}
                                    username={username}
                                    userType="audience"
                                    avatarConfig={avatarConfig}
                                    className="h-full rounded-none border-0"
                                    onSocketReady={setActiveSocket}
                                    onRequestSong={() => setShowRequestModal(true)}
                                />
                            </div>
                        </div>
                    ) : activeTab === 'setlist' ? (
                        <div className="h-full overflow-y-auto p-4 space-y-2 bg-gray-900">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 ml-1">Today's Setlist</h3>
                            {performance.songs && performance.songs.length > 0 ? (
                                performance.songs.map((song: any, idx: number) => (
                                    <div key={idx} className="flex items-center bg-gray-800 p-3 rounded-lg border border-gray-700/50">
                                        <span className="w-6 text-center text-gray-500 font-mono text-sm mr-3 font-bold">{idx + 1}</span>
                                        <div>
                                            <p className="text-white font-bold text-sm">{song.title}</p>
                                            <p className="text-gray-400 text-xs">{song.artist}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No songs listed yet.</p>
                            )}
                        </div>
                    ) : (
                        // Info Tab
                        <div className="h-full overflow-y-auto p-5 bg-gray-900 space-y-6">
                            {/* Singer Profile */}
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-800 rounded-2xl border border-gray-700/50 shadow-xl">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 mb-4 shadow-lg">
                                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                                        {singer?.profile?.avatarUrl ? (
                                            <img src={singer.profile.avatarUrl} alt={singer?.stageName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-white">{singer?.stageName?.[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{singer?.stageName}</h2>
                                <p className="text-indigo-400 text-sm font-medium mb-4">Verified Busker</p>

                                {/* Social Links */}
                                {singer?.socialLinks && (
                                    <div className="flex items-center gap-3 mb-6">
                                        {(() => {
                                            try {
                                                const links = JSON.parse(singer.socialLinks)
                                                return Object.entries(links).map(([platform, url]) => {
                                                    if (!url) return null
                                                    // Map platform to icon
                                                    let Icon = ExternalLink
                                                    if (platform === 'instagram') Icon = Instagram
                                                    if (platform === 'twitter') Icon = Twitter
                                                    if (platform === 'facebook') Icon = Facebook

                                                    return (
                                                        <Link href={url as string} key={platform} target="_blank" className="bg-gray-700 p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 transition">
                                                            <Icon className="w-5 h-5" />
                                                        </Link>
                                                    )
                                                })
                                            } catch (e) { return null }
                                        })()}
                                    </div>
                                )}

                                {/* Booking CTA */}
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-pink-900/30 flex items-center justify-center transition active:scale-95"
                                >
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Book for Event / Wedding
                                </button>
                                <p className="text-[10px] text-gray-500 mt-2 text-center max-w-xs">
                                    Want {singer?.stageName} to perform at your special day? Send a booking inquiry directly!
                                </p>
                            </div>


                        </div>
                    )}
                </div>
            </main>

            <SongRequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleSongRequest}
            />

            <BookingRequestModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSubmit={handleBookingRequest}
                singerName={singer?.stageName || 'the singer'}
            />
        </div>
    )
}
