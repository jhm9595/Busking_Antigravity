'use client'

import Link from 'next/link'
import { Music, Radio, Check, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export const dynamic = 'force-dynamic'

export default function AdminLiveMusicPage() {
  const { t } = useLanguage()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Live Music Monitoring</h2>
      
      <div className="mb-6">
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-card/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-bold">Singer</th>
                <th className="text-left p-4 text-sm font-bold">Performance</th>
                <th className="text-left p-4 text-sm font-bold">Status</th>
                <th className="text-left p-4 text-sm font-bold">Viewers</th>
                <th className="text-left p-4 text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample data */}
              <tr className="border-b border-border hover:bg-card/50 transition-colors">
                <td className="p-4">Demo Artist</td>
                <td className="p-4 text-sm">Demo Live Session</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs animate-pulse">🔴 Live</span>
                </td>
                <td className="p-4 text-sm">127</td>
                <td className="p-4">
                  <Link href="/admin/live/123" className="text-sm text-primary hover:underline">Manage</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
