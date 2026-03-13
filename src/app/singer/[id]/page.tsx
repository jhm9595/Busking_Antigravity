'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Share2, Heart, Music, Mail, ExternalLink, User, MapPin, Calendar, MessageCircle, Play, Home, Clock } from 'lucide-react'
import { FaFacebook, FaYoutube, FaInstagram, FaSoundcloud, FaTiktok } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@clerk/nextjs'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { getPerformanceById, getSinger, updatePerformanceStatus } from '@/services/singer'
import { getEffectiveStatus, formatLocalDate, formatLocalTime } from '@/utils/performance'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-800 text-gray-500 italic text-sm">Loading Map...</div>,
    ssr: false
})

interface SingerData {
    id: string
    stageName: string
    fanCount: number
    isVerified: boolean
    performances: any[]
    bio?: string
    profile?: {
        avatarUrl?: string
    }
}

export default function SingerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { t } = useLanguage()
    const { user, isLoaded } = useUser()
    const [singer, setSinger] = useState<SingerData | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedPerfId, setExpandedPerfId] = useState<string | null>(null)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [isFollowed, setIsFollowed] = useState(false)

    useEffect(() => {
        async function fetchData() {
            if (!params.id) return
            const singerId = params.id as string
            if (!isLoaded) return

            try {
                const res = await fetch(`/api/singers/${singerId}`)
                if (!res.ok) throw new Error(t('common.error_fetch_singer'))
                const data = await res.json()
                setSinger(data)

                // Auto-redirect to live if a performance is currently live
                const activeLive = data.performances?.find((p: any) => getEffectiveStatus(p) === 'live')
                if (activeLive) {
                    router.push(`/live/${activeLive.id}`)
                    return
                }

                if (typeof window !== 'undefined') {
                    let fanId = user?.id
                    if (!fanId) {
                        const storedFanId = localStorage.getItem('busking_fan_id') || `fan_${Math.random().toString(36).substr(2, 9)}`
                        localStorage.setItem('busking_fan_id', storedFanId)
                        fanId = storedFanId
                    }

                    const followRes = await fetch(`/api/singers/${singerId}/follow?fanId=${fanId}`)
                    if (followRes.ok) {
                        const followData = await followRes.json()
                        setIsFollowed(followData.isFollowed)
                        setSinger(prev => prev ? { ...prev, fanCount: followData.fanCount } : null)
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [params.id, user, isLoaded, t])

    const handleFollow = async () => {
        if (!singer) return
        const prevFollowed = isFollowed
        const prevCount = singer.fanCount
        setIsFollowed(!isFollowed)
        setSinger({ ...singer, fanCount: isFollowed ? singer.fanCount - 1 : singer.fanCount + 1 })

        let fanId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('busking_fan_id') : null)
        if (!fanId) return

        try {
            const res = await fetch(`/api/singers/${singer.id}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fanId })
            })
            if (!res.ok) throw new Error(t('common.error_follow'))
            const data = await res.json()
            setIsFollowed(data.isFollowed)
            setSinger(prev => prev ? { ...prev, fanCount: data.fanCount } : null)
        } catch (error) {
            console.error(error)
            setIsFollowed(prevFollowed)
            setSinger(prev => prev ? { ...prev, fanCount: prevCount } : null)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: singer?.stageName,
                    url: window.location.href,
                })
            } catch (error) { }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert(t('common.link_copied'))
        }
    }

    const openSocial = (input: string | undefined, type: string) => {
        if (!input) return
        let finalUrl = input.trim()
        if (!finalUrl.startsWith('http')) {
            if (finalUrl.includes('.')) {
                finalUrl = `https://${finalUrl}`
            } else {
                switch (type) {
                    case 'instagram': finalUrl = `https://instagram.com/${finalUrl}`; break;
                    case 'facebook': finalUrl = `https://facebook.com/${finalUrl}`; break;
                    case 'youtube': finalUrl = `https://youtube.com/@${finalUrl}`; break;
                    case 'tiktok': finalUrl = `https://tiktok.com/@${finalUrl}`; break;
                    case 'soundcloud': finalUrl = `https://soundcloud.com/${finalUrl}`; break;
                    case 'twitter': finalUrl = `https://twitter.com/${finalUrl}`; break;
                    default: finalUrl = `https://${finalUrl}`;
                }
            }
        }
        window.open(finalUrl, '_blank')
    }

    const socialLinks = (singer as any)?.socialLinks ? JSON.parse((singer as any).socialLinks) : {}

    const handleBookingSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ singerId: singer?.id, ...data })
            })
            if (!res.ok) throw new Error('Booking failed')
            alert(t('common.enquiry_sent'))
            setIsBookingModalOpen(false)
        } catch (error) {
            console.error('Booking Error:', error)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white italic">{t('common.loading')}</div>
    if (!singer) return <div className="min-h-screen flex items-center justify-center bg-[#0f1117] text-white font-black italic uppercase tracking-widest">{t('common.not_found_artist')}</div>

    return (
        <div className="min-h-screen bg-[#0f1117] text-white pb-24 font-display selection:bg-indigo-500/30">
            {/* 1. HERO SECTION: Profile & Status */}
            <div className="relative h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 to-[#0f1117] z-0" />
                
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="grid grid-cols-8 gap-4 rotate-12 -translate-y-24">
                        {[...Array(32)].map((_, i) => (
                            <Music key={i} className="w-16 h-16 text-white" />
                        ))}
                    </div>
                </div>

                <div className="absolute top-4 left-4 z-20">
                    <Link href="/" className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg backdrop-blur-md" title={t('common.home_button')}>
                        <Home className="w-5 h-5" />
                    </Link>
                </div>

                <div className="absolute top-4 right-4 z-20">
                    <LanguageSwitcher />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 z-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full border-4 border-[#0f1117] bg-gray-800 overflow-hidden shadow-2xl shadow-indigo-500/20">
                            {singer.profile?.avatarUrl ? (
                                <img src={singer.profile.avatarUrl} className="w-full h-full object-cover" alt={singer.stageName} />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-black text-white italic">
                                    {singer.stageName?.[0] || t('common.singer_fallback')[0]}
                                </div>
                            )}
                        </div>
                        {singer.performances.some((p: any) => getEffectiveStatus(p) === 'live') && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-600/40 border border-red-500 tracking-tighter italic">
                                {t('live.status_live')}
                            </div>
                        )}
                    </div>
                    
                    <h1 className="text-3xl font-black italic tracking-tight mb-1 uppercase">{singer.stageName || t('common.singer_fallback')}</h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 italic">
                            <Heart className={`w-3.5 h-3.5 ${isFollowed ? 'text-red-500 fill-current animate-bounce' : 'text-gray-500'}`} />
                            {singer.fanCount} {t('common.fans')}
                        </span>
                    </div>

                    {/* Social Links Mini Bar */}
                    <div className="flex gap-2.5">
                        {socialLinks.youtube && (
                            <button onClick={() => openSocial(socialLinks.youtube, 'youtube')} className="p-2.5 bg-red-600/10 rounded-xl border border-red-600/20 text-red-500 hover:scale-110 transition-transform shadow-lg shadow-red-600/10">
                                <FaYoutube className="w-4 h-4" />
                            </button>
                        )}
                        {socialLinks.instagram && (
                            <button onClick={() => openSocial(socialLinks.instagram, 'instagram')} className="p-2.5 bg-pink-600/10 rounded-xl border border-pink-600/20 text-pink-500 hover:scale-110 transition-transform shadow-lg shadow-pink-600/10">
                                <FaInstagram className="w-4 h-4" />
                            </button>
                        )}
                        {socialLinks.tiktok && (
                            <button onClick={() => openSocial(socialLinks.tiktok, 'tiktok')} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:scale-110 transition-transform shadow-lg">
                                <FaTiktok className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={handleShare} className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-600/20 text-indigo-400 hover:scale-110 transition-transform shadow-lg shadow-indigo-600/10">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-6 max-w-lg mx-auto">
                {/* 2. BIO SECTION */}
                {singer.bio && (
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-600/10 transition-all" />
                        <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3 italic">
                            <User className="w-3 h-3" /> {t('common.about_artist')}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed italic font-medium whitespace-pre-line relative z-10">
                            {singer.bio}
                        </p>
                    </div>
                )}

                {/* 3. PRIMARY ACTION BUTTONS */}
                <div className="flex gap-3 sticky top-4 z-30 pointer-events-auto">
                    {isLoaded && user ? (
                        <button
                            onClick={handleFollow}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all active:scale-95 shadow-2xl italic border ${isFollowed
                                ? 'bg-gray-800 text-gray-500 border-white/5'
                                : 'bg-white text-black hover:bg-gray-100 shadow-white/10 border-white/20'
                                }`}
                        >
                            {isFollowed ? t('common.following') : t('common.follow')}
                        </button>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all bg-white text-black text-center shadow-2xl border border-white/20 italic flex items-center justify-center"
                        >
                            {t('common.login_to_follow')}
                        </Link>
                    )}
                    <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all border border-indigo-400/20 italic"
                    >
                        {t('booking.modal.title')}
                    </button>
                </div>

                {/* 4. LIVE NOW HIGHLIGHT (HIGHEST PRIORITY) */}
                {singer.performances.some((p: any) => getEffectiveStatus(p) === 'live') && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-1000">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic flex items-center gap-2 tracking-tight uppercase">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]"></span>
                                </span>
                                {t('live.status_live')}
                            </h2>
                        </div>
                        {singer.performances
                            .filter((p: any) => getEffectiveStatus(p) === 'live')
                            .map((perf: any) => (
                                <div key={perf.id} className="relative group p-[2px] rounded-[36px] bg-gradient-to-br from-red-500 via-rose-600 to-indigo-700 shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden hover:scale-[1.02] transition-all duration-700">
                                    <div className="bg-gray-950 rounded-[34px] p-8 relative z-10 overflow-hidden">
                                        {/* Animated Background Pulse */}
                                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-600/20 rounded-full blur-[80px] group-hover:bg-red-600/30 transition-all duration-1000" />
                                        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] group-hover:bg-indigo-600/20 transition-all duration-1000" />
                                        
                                        <div className="relative z-20">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-2 italic flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                                        {t('live.performing_now')}
                                                    </div>
                                                    <h3 className="font-black text-3xl text-white italic truncate tracking-tighter mb-6 uppercase leading-none">{perf.title}</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-xs font-bold text-indigo-300 italic bg-white/5 w-fit px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                                                            <Calendar className="w-4 h-4 text-indigo-400" />
                                                            <span suppressHydrationWarning>{new Date(perf.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-emerald-400 italic bg-white/5 w-fit px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                                                            <Clock className="w-4 h-4 text-emerald-400" />
                                                            <span suppressHydrationWarning>{formatLocalTime(perf.startTime)} - {perf.endTime ? formatLocalTime(perf.endTime) : '...'}</span>
                                                        </div>
                                                        {perf.locationText && (
                                                            <div className="flex items-center gap-3 text-xs font-bold text-amber-400 italic bg-white/5 w-fit px-4 py-2 rounded-2xl border border-white/5 shadow-inner max-w-full">
                                                                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span className="truncate">{perf.locationText}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link href={`/live/${perf.id}`} className="w-full bg-white text-black py-6 rounded-[24px] font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-rose-50 hover:scale-[1.02] active:scale-95 transition-all italic border-b-4 border-gray-200">
                                                <Play className="w-6 h-6 fill-current animate-pulse" />
                                                {t('live.enter_live')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* 5. UPCOMING SCHEDULES */}
                <div className="space-y-4">
                    <h2 className="text-xl font-black italic flex items-center gap-3 tracking-tight uppercase">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        {t('performance.upcoming')}
                    </h2>
                    <div className="space-y-4">
                        {singer.performances.filter((p: any) => getEffectiveStatus(p) === 'planned').length === 0 ? (
                            <div className="p-10 bg-white/5 rounded-3xl border border-dashed border-white/5 text-center text-gray-600 text-xs font-black uppercase italic tracking-widest">
                                {t('performance.list.empty_upcoming')}
                            </div>
                        ) : (
                            singer.performances
                                .filter((p: any) => getEffectiveStatus(p) === 'planned')
                                .map((perf: any) => (
                                    <div key={perf.id} className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/20 transition-all shadow-xl">
                                        <div className="p-5 relative">
                                            <div className="flex flex-col gap-1 mb-5">
                                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 w-fit px-2.5 py-1 rounded-full mb-1 italic">
                                                    {formatLocalDate(perf.startTime)}
                                                </span>
                                                <h3 className="font-black text-lg text-white italic tracking-tight uppercase">{perf.title}</h3>
                                                <p className="text-gray-500 text-xs font-bold flex items-center gap-1.5 italic">
                                                    <MapPin className="w-3 h-3" /> {perf.locationText}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {perf.locationLat && perf.locationLng && (
                                                    <button
                                                        onClick={() => setExpandedPerfId(expandedPerfId === perf.id ? null : perf.id)}
                                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all border border-white/5 italic"
                                                    >
                                                        {expandedPerfId === perf.id ? t('performance.form.map_hide') : t('performance.form.map_show')}
                                                    </button>
                                                )}
                                                {perf.chatEnabled && (
                                                    <Link
                                                        href={`/live/${perf.id}`}
                                                        className="flex-1 bg-indigo-600/90 hover:bg-indigo-600 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 text-center border border-indigo-400/30 italic"
                                                    >
                                                        {t('live.enter_chat')}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {expandedPerfId === perf.id && perf.locationLat && perf.locationLng && (
                                            <div className="p-4 bg-gray-950 border-t border-white/5 h-64 animate-in slide-in-from-top-2 duration-500">
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
            </div>

            {/* Booking Modal */}
            <BookingRequestModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                onSubmit={handleBookingSubmit}
                singerName={singer.stageName || t('common.singer_fallback')}
            />
        </div>
    )
}
