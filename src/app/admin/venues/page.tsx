'use client'

import Link from 'next/link'
import { MapPin, BarChart3, Shield, Music, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export const dynamic = 'force-dynamic'

export default function AdminVenuesPage() {
  const { t } = useLanguage()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Venue Management</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90">
            <Plus className="w-4 h-4 inline mr-2" />
            Register New Venue
          </button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-bold">Venue Name</th>
              <th className="text-left p-4 text-sm font-bold">Address</th>
              <th className="text-left p-4 text-sm font-bold">Verified</th>
              <th className="text-left p-4 text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample data - replace with real data */}
            <tr className="border-b border-border hover:bg-card/50 transition-colors">
              <td className="p-4">Hongdae Walking Street Spot A</td>
              <td className="p-4 text-sm text-muted-foreground">Seoul, Mapo-gu</td>
              <td className="p-4"><span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">✓ Verified</span></td>
              <td className="p-4">
                <Link href="/admin/venues/123" className="text-sm text-primary hover:underline">View</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
