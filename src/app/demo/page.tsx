'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music, MapPin, Radio, QrCode, Users, Play } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DemoPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [demoReady, setDemoReady] = useState(false)
  const [demoSingerId, setDemoSingerId] = useState<string | null>(null)
  const [demoPerformances, setDemoPerformances] = useState<any[]>([])

  useEffect(() => {
    async function initDemo() {
      try {
        // Call demo API to ensure demo data exists
        const res = await fetch('/api/demo')
        const data = await res.json()
        
        if (data.singerId) {
          setDemoSingerId(data.singerId)
          setDemoPerformances(data.performanceIds || [])
          setDemoReady(true)
        }
      } catch (error) {
        console.error('Demo init failed:', error)
      }
    }
    initDemo()
  }, [])

  const features = [
    {
      title: 'Singer Profile',
      desc: 'Stage name, bio, social links, QR code, follower count',
      icon: <Users className="h-6 w-6 text-cyan-300" />,
      href: (id: string) => `/demo/singer/${id}`,
      color: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'Live Performance',
      desc: 'Real-time chat, setlist, song requests, countdown timer',
      icon: <Radio className="h-6 w-6 text-emerald-300" />,
      href: (id: string) => `/demo/live/${id}`,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Explore Map',
      desc: 'Grid/Map toggle, search, filter by live/scheduled',
      icon: <MapPin className="h-6 w-6 text-amber-300" />,
      href: () => '/demo/explore',
      color: 'from-amber-400 to-orange-500'
    },
    {
      title: 'Song Management',
      desc: 'Repertoire, setlist creation, YouTube links',
      icon: <Music className="h-6 w-6 text-purple-300" />,
      href: (id: string) => `/demo/singer/${id}#songs`,
      color: 'from-purple-400 to-pink-500'
    },
    {
      title: 'QR Code Share',
      desc: 'Unique QR for each singer, @stageName format',
      icon: <QrCode className="h-6 w-6 text-rose-300" />,
      href: (id: string) => `/demo/singer/${id}`,
      color: 'from-rose-400 to-red-500'
    },
    {
      title: 'Performance Dashboard',
      desc: 'Split view, song status toggle, chat control',
      icon: <Play className="h-6 w-6 text-indigo-300" />,
      href: (id: string) => `/demo/live/${id}`,
      color: 'from-indigo-400 to-violet-500'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
          <Play className="h-4 w-4" /> Demo Mode
        </div>
        
        <h1 className="text-5xl font-black italic tracking-tight md:text-7xl">
          Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">All Features</span>
        </h1>
        
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/60">
          This demo showcases every feature of the platform. All data is simulated - no real transactions, no real points deducted.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={() => {
                if (!demoReady) return
                const href = typeof feature.href === 'function' 
                  ? demoSingerId 
                    ? feature.href(demoSingerId)
                    : '/api/demo?action=ensure'
                  : feature.href
                router.push(href)
              }}
              className="group cursor-pointer rounded-[28px] border border-white/8 bg-white/[0.04] p-6 transition-all hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-20`}>
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-black">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Now CTA */}
        {demoReady && demoPerformances.length > 0 && (
          <div className="mt-12 rounded-[36px] border border-emerald-400/20 bg-emerald-400/5 p-8 text-center">
            <div className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Live Now in Demo</div>
            <h2 className="mb-6 text-3xl font-black italic">Try the live experience</h2>
            <button
              onClick={() => router.push(`/demo/live/${demoPerformances[0]}`)}
              className="rounded-2xl bg-emerald-400 px-8 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-emerald-300"
            >
              Join Live Demo
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
