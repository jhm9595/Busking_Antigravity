'use client'

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { getSinger, registerSinger, updateSingerProfile, getPerformances, updatePerformanceStatus, withdrawUser, updateNickname, getUserPoints, chargePoints } from '@/services/singer'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Users, Music, MapPin, BarChart3, Shield, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { t } = useLanguage()

  // TODO: Add admin authentication check here
  // const { user } = useUser()
  // if (!user) redirect('/login')
  // Check if user has admin role in Profile

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-black">🛡 Admin</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              redirect('/')
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link href="/admin/singers" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-sm font-bold">Singers</div>
          </Link>
          <Link href="/admin/venues" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-sm font-bold">Venues</div>
          </Link>
          <Link href="/admin/analytics" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-sm font-bold">Analytics</div>
          </Link>
          <Link href="/admin/moderation" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <div className="text-sm font-bold">Moderation</div>
          </Link>
          <Link href="/admin/live" className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-center">
            <Music className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-sm font-bold">Live Music</div>
          </Link>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}
