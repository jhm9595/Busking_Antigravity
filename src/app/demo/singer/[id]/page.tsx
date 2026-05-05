'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDemoData } from '@/lib/demo-mode'
import { getSinger } from '@/services/singer'
import { QRCodeSVG } from '@/lib/qrcode'
import { Users, Music, MapPin, QrCode, Star, Calendar } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DemoSingerPage() {
  const router = useRouter()
  const [singer, setSinger] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    async function loadDemo() {
      try {
        const demoData = await getDemoData()
        if (!demoData?.singerId) {
          router.push('/demo')
          return
        }

        const s = await getSinger(demoData.singerId)
        if (s) setSinger(s)
      } catch (error) {
        console.error('Demo singer load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDemo()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    )
  }

  if (!singer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-black">Demo singer not found</h2>
          <button 
            onClick={() => router.push('/demo')}
            className="mt-4 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-black"
          >
            Back to Demo Home
          </button>
        </div>
      </div>
    )
  }

  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/demo/singer/${singer.id}`
  const performances = singer.performances || []
  const songs = singer.songs || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Demo Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
        🎭 DEMO MODE - Singer Profile Preview (No real transactions)
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Profile Header */}
        <section className="mb-8 rounded-[36px] border border-white/8 bg-[#0f1d31] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {/* Avatar */}
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-4xl font-black text-black">
              {(singer.stageName || 'D').charAt(0)}
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-4xl font-black italic">{singer.stageName}</h1>
                {singer.isVerified && (
                  <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">Verified</div>
                )}
              </div>
              
              <p className="mb-4 max-w-xl text-sm leading-relaxed text-white/60">{singer.bio}</p>
              
              <div className="flex flex-wrap gap-4 text-sm font-bold text-white/74">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-300" />
                  {singer.fanCount || 0} Followers
                </div>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-emerald-300" />
                  {performances.length} Performances
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-300" />
                  {songs.length} Songs
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="inline-block rounded-2xl border border-white/8 bg-white p-4">
                <QRCodeSVG value={qrValue} size={128} />
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">@{singer.stageName}</p>
            </div>
          </div>
        </section>

        {/* Performances */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-black">Performances</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {performances.map((perf: any) => (
              <div 
                key={perf.id}
                onClick={() => router.push(`/demo/live/${perf.id}`)}
                className="cursor-pointer rounded-[28px] border border-white/8 bg-white/[0.04] p-6 transition-all hover:border-white/20"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                    perf.status === 'live' ? 'bg-red-500/10 text-red-300' : 
                    perf.status === 'scheduled' ? 'bg-cyan-400/10 text-cyan-300' : 
                    'bg-white/5 text-white/45'
                  }`}>
                    {perf.status === 'live' ? '🔴 Live' : perf.status === 'scheduled' ? '⏰ Scheduled' : perf.status}
                  </div>
                </div>
                <h3 className="mb-2 font-black italic">{perf.title}</h3>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4" />
                  {perf.locationText}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <Calendar className="h-4 w-4" />
                  {new Date(perf.startTime).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Songs / Repertoire */}
        <section>
          <h2 className="mb-4 text-2xl font-black">Repertoire</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {songs.slice(0, 6).map((song: any) => (
              <div key={song.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="font-black">{song.title}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{song.artist}</div>
                {song.youtubeUrl && (
                  <a 
                    href={song.youtubeUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300"
                  >
                    Watch on YouTube →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
