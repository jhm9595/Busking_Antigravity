'use client'

import Link from 'next/link'
import { Shield, Check, X, MessageSquare } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export const dynamic = 'force-dynamic'

export default function AdminModerationPage() {
  const { t } = useLanguage()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Content Moderation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-3xl border border-border">
          <h3 className="text-lg font-bold mb-4">Reported Content</h3>
          <div className="space-y-3">
            {/* Sample data */}
            <div className="p-4 bg-card/50 rounded-xl border border-border">
              <p className="text-sm mb-2">Inappropriate song request content</p>
              <p className="text-xs text-muted-foreground mb-3">Reported by: user_1234 • 2024-01-15</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/20">✓ Approve</button>
                <button className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20">✗ Dismiss</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border">
          <h3 className="text-lg font-bold mb-4">User Reports</h3>
          <div className="space-y-3">
            {/* Sample data */}
            <div className="p-4 bg-card/50 rounded-xl border border-border">
              <p className="text-sm mb-2"><strong>singer_5678</strong> reported for fake profile</p>
              <p className="text-xs text-muted-foreground mb-3">Reported by: fan_9012 • 2024-01-14</p>
              <div className="flex gap-2">
                <Link href="/admin/singers/5678" className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20">View Singer</Link>
                <button className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20">Ban User</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
