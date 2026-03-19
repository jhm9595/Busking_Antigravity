'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import GoogleAd from '@/components/common/GoogleAd'
import { Share2, Heart, Music, Mail, ExternalLink, User, MapPin, Calendar, MessageCircle, Play, Clock } from 'lucide-react'
import { FaFacebook, FaYoutube, FaInstagram, FaSoundcloud, FaTiktok } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@clerk/nextjs'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { getPerformanceById, getSinger, updatePerformanceStatus } from '@/services/singer'
import { getEffectiveStatus, formatLocalDate, formatLocalTime } from '@/utils/performance'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/common/MapPicker'), {
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground italic text-sm">Loading Map...</div>,
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

                // NOTE: Removed auto-redirect to live room
                // Users should intentionally choose when to enter live, not be forced
                // The profile page already shows a prominent "LIVE NOW" section with "Enter Live" button

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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground italic">{t('common.loading')}</div>
    if (!singer) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-black italic uppercase tracking-widest">{t('common.not_found_artist')}</div>

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 font-display selection:bg-primary/30">
            {/* 1. HERO SECTION: Profile & Status */}
            <div className="relative h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background z-0" />
                
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="grid grid-cols-8 gap-4 rotate-12 -translate-y-24">
                        {[...Array(32)].map((_, i) => (
                            <Music key={i} className="w-16 h-16 text-foreground" />
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 z-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full border-4 border-background bg-muted overflow-hidden shadow-2xl shadow-primary/20">
                            {singer.profile?.avatarUrl ? (
                                <img src={singer.profile.avatarUrl} className="w-full h-full object-cover" alt={singer.stageName} />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-4xl font-black italic">
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
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5 bg-card px-3 py-1 rounded-full border border-border italic">
                            <Heart className={`w-3.5 h-3.5 ${isFollowed ? 'text-red-500 fill-current animate-bounce' : 'text-muted-foreground'}`} />
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
                            <button onClick={() => openSocial(socialLinks.tiktok, 'tiktok')} className="p-2.5 bg-card rounded-xl border border-border text-foreground hover:scale-110 transition-transform shadow-lg">
                                <FaTiktok className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={handleShare} className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-6 max-w-lg mx-auto">
                {/* 2. BIO SECTION */}
                {singer.bio && (
                    <div className="bg-card rounded-3xl p-5 border border-border shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />
                        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 italic">
                            <User className="w-3 h-3" /> {t('common.about_artist')}
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed italic font-medium whitespace-pre-line relative z-10">
                            {singer.bio}
                        </p>
                    </div>
                )}

                <GoogleAd slot="singer_profile_mid" className="opacity-30 scale-90" />

                {/* 3. PRIMARY ACTION BUTTONS */}
                <div className="flex gap-3 sticky top-20 z-30 pointer-events-auto">
                    {isLoaded && user ? (
                        <button
                            onClick={handleFollow}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all active:scale-95 shadow-2xl italic border ${isFollowed
                                ? 'bg-muted text-muted-foreground border-border'
                                : 'bg-foreground text-background hover:bg-foreground/90 shadow-foreground/10 border-foreground/20'
                                }`}
                        >
                            {isFollowed ? t('common.following') : t('common.follow')}
                        </button>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all bg-foreground text-background text-center shadow-2xl border border-foreground/20 italic flex items-center justify-center"
                        >
                            {t('common.login_to_follow')}
                        </Link>
                    )}
                    <button
                        onClick={() => setIsBookingModalOpen(true)}
                        className="flex-1 bg-gradient-to-br from-primary to-primary/80 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all border border-primary/20 italic text-primary-foreground"
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
                                <div key={perf.id} className="relative group p-[2px] rounded-[36px] bg-gradient-to-br from-red-500 via-rose-600 to-primary shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden hover:scale-[1.02] transition-all duration-700">
                                    <div className="bg-card rounded-[34px] p-8 relative z-10 overflow-hidden">
                                        {/* Animated Background Pulse */}
                                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-600/20 rounded-full blur-[80px] group-hover:bg-red-600/30 transition-all duration-1000" />
                                        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000" />
                                        
                                        <div className="relative z-20">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="min-w-0">
                                                    <div className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-2 italic flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                                        {t('live.performing_now')}
                                                    </div>
                                                    <h3 className="font-black text-3xl text-foreground italic truncate tracking-tighter mb-6 uppercase leading-none">{perf.title}</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3 text-xs font-bold text-primary italic bg-card w-fit px-4 py-2 rounded-2xl border border-border shadow-inner">
                                                            <Calendar className="w-4 h-4 text-primary" />
                                                            <span suppressHydrationWarning>{new Date(perf.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-emerald-400 italic bg-card w-fit px-4 py-2 rounded-2xl border border-border shadow-inner">
                                                            <Clock className="w-4 h-4 text-emerald-400" />
                                                            <span suppressHydrationWarning>{formatLocalTime(perf.startTime)} - {perf.endTime ? formatLocalTime(perf.endTime) : '...'}</span>
                                                        </div>
                                                        {perf.locationText && (
                                                            <div className="flex items-center gap-3 text-xs font-bold text-amber-400 italic bg-card w-fit px-4 py-2 rounded-2xl border border-border shadow-inner max-w-full">
                                                                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                                                <span className="truncate">{perf.locationText}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link href={`/live/${perf.id}`} className="w-full bg-foreground text-background py-6 rounded-[24px] font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-foreground/90 hover:scale-[1.02] active:scale-95 transition-all italic border-b-4 border-muted">
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
                        <Calendar className="w-5 h-5 text-primary" />
                        {t('performance.upcoming')}
                    </h2>
                    <div className="space-y-4">
                        {singer.performances.filter((p: any) => getEffectiveStatus(p) === 'planned').length === 0 ? (
                            <div className="p-10 bg-card rounded-3xl border border-dashed border-border text-center text-muted-foreground text-xs font-black uppercase italic tracking-widest">
                                {t('performance.list.empty_upcoming')}
                            </div>
                        ) : (
                            singer.performances
                                .filter((p: any) => getEffectiveStatus(p) === 'planned')
                                .map((perf: any) => (
                                    <div key={perf.id} className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
                                        <div className="p-5 relative">
                                            <div className="flex flex-col gap-1 mb-5">
                                                <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-2.5 py-1 rounded-full mb-1 italic">
                                                    {formatLocalDate(perf.startTime)}
                                                </span>
                                                <h3 className="font-black text-lg text-foreground italic tracking-tight uppercase">{perf.title}</h3>
                                                <p className="text-muted-foreground text-xs font-bold flex items-center gap-1.5 italic">
                                                    <MapPin className="w-3 h-3" /> {perf.locationText}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                {perf.locationLat && perf.locationLng && (
                                                    <button
                                                        onClick={() => setExpandedPerfId(expandedPerfId === perf.id ? null : perf.id)}
                                                        className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all border border-border italic"
                                                    >
                                                        {expandedPerfId === perf.id ? t('performance.form.map_hide') : t('performance.form.map_show')}
                                                    </button>
                                                )}
                                                {perf.chatEnabled && (
                                                    <Link
                                                        href={`/live/${perf.id}`}
                                                        className="flex-1 bg-primary/90 hover:bg-primary text-primary-foreground font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 text-center border border-primary/30 italic"
                                                    >
                                                        {t('live.enter_chat')}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {expandedPerfId === perf.id && perf.locationLat && perf.locationLng && (
                                            <div className="p-4 bg-background border-t border-border h-64 animate-in slide-in-from-top-2 duration-500">
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

                    <GoogleAd slot="singer_profile_performances" className="my-8" />
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
