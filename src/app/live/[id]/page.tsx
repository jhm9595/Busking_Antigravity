'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatBox from '@/components/chat/ChatBox'
import { getPerformanceById, createSongRequest } from '@/services/singer'
import AvatarCreator from '@/components/audience/AvatarCreator'
import { AvatarConfig } from '@/components/audience/PixelAvatar'
import SongRequestModal from '@/components/audience/SongRequestModal'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { PlayCircle, Camera, Music, CalendarIcon, MessageCircle, Home, Compass, Heart, User as UserIcon } from 'lucide-react'
import { createBookingRequest, getSinger } from '@/services/singer'
import Link from 'next/link'

export default function AudienceLivePage() {
    const params = useParams()
    const performanceId = params.id as string
    const [performance, setPerformance] = useState<any>(null)
    const [username, setUsername] = useState('')

    const [userType, setUserType] = useState<'anon' | 'named'>('named')
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [singer, setSinger] = useState<any>(null)
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

    const handleSongRequest = async (title: string, artist: string) => {
        if (!performanceId) return
        try {
            await createSongRequest({ performanceId, title, artist })
            if (activeSocket) {
                activeSocket.emit('song_requested', { performanceId, title, username })
            }
            alert('Your song request has been sent!')
        } catch (error) {
            console.error(error)
            alert('Failed to send request.')
        }
    }

    const handleBookingRequest = async (data: any) => {
        if (!performance?.singerId) return
        await createBookingRequest({ singerId: performance.singerId, ...data })
        alert('Booking enquiry sent! The singer will contact you soon.')
    }

    if (!performance) return <div className="h-screen bg-background-dark text-slate-100 flex items-center justify-center">Loading Performance...</div>

    const currentSong = performance.songs?.[0] || { title: 'Wonderwall', artist: 'Oasis' }
    const nextSong = performance.songs?.[1] || { title: 'Fast Car — Tracy Chapman' }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto border-x border-primary/10 shadow-2xl font-display">
            {/* Header Section */}
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md border-b border-white/5 pr-4 pl-20 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-white/10 flex items-center justify-center">
                        {singer?.profile?.avatarUrl ? (
                            <img className="w-full h-full object-cover" src={singer.profile.avatarUrl} alt={singer?.stageName} />
                        ) : (
                            <span className="font-bold">{singer?.stageName?.[0] || 'A'}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">{singer?.stageName || 'Alex Rivers'}</h1>
                        <p className="text-xs text-primary font-medium">@{singer?.stageName?.toLowerCase().replace(/\s+/g, '') || 'arivers_music'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <PlayCircle className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <Camera className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                {/* Live Setlist Card */}
                <section className="p-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </div>
                        <p className="text-[10px] font-bold tracking-widest text-primary uppercase mb-2">Now Playing</p>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-background-dark rounded-lg flex items-center justify-center border border-white/5">
                                <Music className="text-primary w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{currentSong.title}</h3>
                                <p className="text-sm text-slate-400">{currentSong.artist}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Up Next</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">{nextSong.title} {nextSong.artist ? `— ${nextSong.artist}` : ''}</span>
                                <span className="text-xs text-primary font-medium">Coming soon</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Booking CTA */}
                <section className="px-4 mb-4">
                    <button onClick={() => setShowBookingModal(true)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all">
                        <CalendarIcon className="w-5 h-5" />
                        Request for Performance
                    </button>
                </section>

                {/* Live Chat Section */}
                <section className="flex flex-col flex-1 px-4 pb-4 min-h-[400px]">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold flex items-center gap-2">
                            <MessageCircle className="text-primary w-4 h-4" />
                            Live Chat
                        </h2>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 uppercase tracking-tighter">1.2k Viewing</span>
                    </div>
                    {/* The ChatBox component itself */}
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                        <ChatBox
                            performanceId={performanceId}
                            username={username}
                            userType="audience"
                            avatarConfig={avatarConfig}
                            className="flex-1 overflow-hidden"
                            onSocketReady={setActiveSocket}
                            onRequestSong={() => setShowRequestModal(true)}
                        />
                    </div>
                </section>

                <div className="h-16"></div> {/* Spacer for footer */}
            </main>

            {/* Bottom Navigation Component (Mobile standard) */}
            <nav className="sticky bottom-0 bg-background-dark/95 border-t border-white/5 px-6 py-2 flex justify-between items-center z-50">
                <Link href="/" className="flex flex-col items-center gap-1 text-primary">
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/explore" className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
                    <Compass className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Discover</span>
                </Link>
                <div className="w-12 h-12 -mt-8 bg-primary rounded-full flex items-center justify-center text-white border-4 border-background-dark shadow-xl shrink-0 cursor-pointer hover:scale-105 transition">
                    <Heart className="w-6 h-6 fill-white" />
                </div>
                <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Events</span>
                </button>
                <Link href={`/singer/${performance.singerId}`} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
                    <UserIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </nav>

            {/* Modals */}
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

            {/* Avatar Creator Modal for first time chat */}
            {!username && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <AvatarCreator
                        onComplete={(name, config, type) => {
                            setUsername(name)
                            setAvatarConfig(config)
                            setUserType(type)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
