'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDemoData } from '@/lib/demo-mode'
import { getPerformanceById, getSinger } from '@/services/singer'
import ChatBox from '@/components/chat/ChatBox'
import SongRequestModal from '@/components/audience/SongRequestModal'
import { Music, Clock, MapPin, Heart, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DemoLivePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [performance, setPerformance] = useState<any>(null)
  const [singer, setSinger] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    async function loadDemo() {
      try {
        // Ensure demo data exists
        await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ action: 'ensure' }), headers: { 'Content-Type': 'application/json' } })
        
        const demoData = await getDemoData()
        if (!demoData) {
          // Redirect to create demo
          await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ action: 'reset' }), headers: { 'Content-Type': 'application/json' } })
        }

        const p = await getPerformanceById(id)
        if (p) {
          setPerformance(p)
          if (p.singerId) {
            const s = await getSinger(p.singerId)
            setSinger(s)
          }
        }
      } catch (error) {
        console.error('Demo load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDemo()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mx-auto" />
          <p className="text-sm text-white/60">Loading demo...</p>
        </div>
      </div>
    )
  }

  if (!performance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-black">Demo performance not found</h2>
          <button 
            onClick={() => router.push('/demo')}
            className="mt-4 rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
          >
            Back to Demo Home
          </button>
        </div>
      </div>
    )
  }

  const isLive = performance.status === 'live'
  const songs = performance.songs || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Demo Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
        🎭 DEMO MODE - Live Performance Preview (No real transactions)
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Performance Header */}
        <section className="mb-8 rounded-[36px] border border-white/8 bg-[#0f1d31] p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
              {isLive ? '🔴 Live Now' : '⏰ Scheduled'}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300/80">
              Demo Performance
            </div>
          </div>
          
          <h1 className="mb-2 text-4xl font-black italic tracking-tight">{performance.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm font-bold text-white/74">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-cyan-300" />
              {singer?.stageName || 'Demo Artist'}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-300" />
              {performance.locationText}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-300" />
              {new Date(performance.startTime).toLocaleString('ko-KR')}
            </div>
          </div>

          {isLive && (
            <div className="mt-6 flex gap-3">
              <button className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black">
                <MessageCircle className="mr-2 inline h-4 w-4" />
                Join Chat (Demo)
              </button>
              <button className="rounded-2xl border border-white/12 bg-white/6 px-6 py-3 text-sm font-black uppercase tracking-[0.18em]">
                <Heart className="mr-2 inline h-4 w-4" />
                Follow (Demo)
              </button>
            </div>
          )}
        </section>

        {/* Split View for Pad */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Setlist */}
          <section className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-xl font-black">Setlist</h2>
            <div className="space-y-3">
              {songs.map((song: any, index: number) => (
                <div 
                  key={song.id} 
                  className={`rounded-2xl border p-4 ${
                    song.status === 'live' ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-white/8 bg-black/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black italic">{song.title}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{song.artist}</div>
                    </div>
                    {song.status === 'live' && (
                      <div className="rounded-full bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-300">Playing</div>
                    )}
                    {song.status === 'completed' && (
                      <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">Done</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Reactions + Chat */}
          <section className="space-y-6">
            {/* Reactions */}
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xl font-black">Reactions</h2>
              <div className="grid grid-cols-3 gap-4">
                {['128 Likes', '45 Requests', '12 Sponsors'].map((stat) => (
                  <div key={stat} className="rounded-2xl border border-white/8 bg-black/15 p-4 text-center">
                    <div className="text-lg font-black">{stat.split(' ')[0]}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{stat.split(' ')[1]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Preview */}
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xl font-black">Chat Preview</h2>
              <div className="h-64 rounded-2xl border border-white/8 bg-black/20 p-4 overflow-y-auto">
                {['Great performance! 🎉', 'Encore! 🎵', 'Love this song ❤️', 'You rock! 🤘'].map((msg, i) => (
                  <div key={i} className="mb-2 rounded-xl bg-white/5 px-3 py-2 text-sm">{msg}</div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Song Requests Preview */}
        <section className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-black">Song Requests (Demo)</h2>
          <div className="space-y-3">
            {['Imagine - John Lennon', 'Wonderful Tonight - Eric Clapton', 'Someone Like You - Adele'].map((req, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 p-4">
                <div>
                  <div className="font-black">{req.split(' - ')[0]}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{req.split(' - ')[1]}</div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-xl bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">Accept</button>
                  <button className="rounded-xl bg-red-400/10 px-3 py-1 text-[10px] font-black text-red-300">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
