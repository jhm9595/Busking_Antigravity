'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Music, MapPin, BarChart3, Shield, LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="bg-background text-foreground min-h-screen font-display">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-black tracking-tight">🛡 Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Singers Management */}
          <Link href="/admin/singers" className="group">
            <div className="p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Singers</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage singer accounts, verify profiles, update stage names.
              </p>
            </div>
          </Link>

          {/* Venues Management */}
          <Link href="/admin/venues" className="group">
            <div className="p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-green-500/10 text-green-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Venues</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage busking spots, verify locations, update descriptions.
              </p>
            </div>
          </Link>

          {/* Performance Analytics */}
          <Link href="/admin/analytics" className="group">
            <div className="p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Analytics</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                View performance statistics, user activity, revenue reports.
              </p>
            </div>
          </Link>

          {/* Content Moderation */}
          <Link href="/admin/moderation" className="group">
            <div className="p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Moderation</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Review reported content, manage user reports, handle disputes.
              </p>
            </div>
          </Link>

          {/* Live Music Management */}
          <Link href="/admin/live" className="group">
            <div className="p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                  <Music className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black">Live Music</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitor live performances, manage song requests, handle emergencies.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
