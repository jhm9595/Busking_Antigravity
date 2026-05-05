'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { List, MapPin, Radio, Calendar, Filter } from 'lucide-react'
import { getDemoData } from '@/lib/demo-mode'
import GoogleAd from '@/components/common/GoogleAd'
import { useLanguage } from '@/contexts/LanguageContext'

const BuskingMap = dynamic(() => import('@/components/audience/BuskingMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center italic text-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>Loading...</div>
})

export default function DemoExplorePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [demoData, setDemoData] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all')

  useEffect(() => {
    async function loadDemo() {
      try {
        const data = await getDemoData()
        setDemoData(data)
      } catch (error) {
        console.error('Demo explore load error:', error)
      }
    }
    loadDemo()
  }, [])

  const performances = demoData?.performanceIds?.map((id: string) => ({
    id,
    title: id === demoData.performanceIds[0] ? 'Demo Live Session' : 'Demo Evening Acoustic',
    locationText: id === demoData.performanceIds[0] ? 'Hongdae Walking Street' : 'Yeonnam Forest Road',
    status: id === demoData.performanceIds[0] ? 'live' : 'scheduled',
    singerName: 'Demo Artist',
    singerId: demoData.singerId,
  })) || []

  const filtered = performances.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Demo Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
        🎭 DEMO MODE - Explore all features with sample data
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black italic">Explore Performances</h1>
              <p className="mt-1 text-sm text-white/60">Discover live and upcoming busking performances</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                  viewMode === 'grid' ? 'bg-cyan-400 text-black' : 'border border-white/10 bg-white/5 text-white/60'
                }`}
              >
                <List className="mr-1 inline h-3 w-3" /> Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                  viewMode === 'map' ? 'bg-cyan-400 text-black' : 'border border-white/10 bg-white/5 text-white/60'
                }`}
              >
                <MapPin className="mr-1 inline h-3 w-3" /> Map
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'live', 'scheduled'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                  filter === mode
                    ? mode === 'live' ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                    : mode === 'scheduled' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                    : 'border-white/20 bg-white/10 text-white'
                    : 'border-white/10 bg-transparent text-white/40'
                }`}
              >
                {mode === 'live' && <Radio className="mr-1 inline h-3 w-3" />}
                {mode}
              </button>
            ))}
          </div>
        </section>

        {/* Content */}
        {viewMode === 'grid' ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((perf: any) => (
              <div
                key={perf.id}
                onClick={() => router.push(`/demo/live/${perf.id}`)}
                className="cursor-pointer rounded-[28px] border border-white/8 bg-white/[0.04] p-6 transition-all hover:border-white/20"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    perf.status === 'live' ? 'bg-red-500/10 text-red-300' : 'bg-cyan-400/10 text-cyan-300'
                  }`}>
                    {perf.status === 'live' ? '🔴 Live Now' : '⏰ Scheduled'}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-black italic">{perf.title}</h3>
                <div className="space-y-2 text-sm font-bold text-white/74">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-300" />
                    {perf.locationText}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-300" />
                    {perf.status === 'live' ? 'Live now' : 'Upcoming'}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-black">
                    {perf.singerName?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{perf.singerName}</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Singer</div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
            <BuskingMap />
          </section>
        )}

        {/* Google Ad for AdSense crawling */}
        <section className="mt-8">
          <GoogleAd />
        </section>
      </main>
    </div>
  )
}
