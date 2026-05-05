'use client'

import Link from 'next/link'
import { Users, Plus, Search, Filter } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export const dynamic = 'force-dynamic'

export default function AdminSingersPage() {
  const { t } = useLanguage()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black">Singer Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search singers..."
              className="pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-sm"
            />
          </div>
          <button className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-bold">Stage Name</th>
              <th className="text-left p-4 text-sm font-bold">Email</th>
              <th className="text-left p-4 text-sm font-bold">Verified</th>
              <th className="text-left p-4 text-sm font-bold">Fans</th>
              <th className="text-left p-4 text-sm font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample data - replace with real data */}
            <tr className="border-b border-border hover:bg-card/50 transition-colors">
              <td className="p-4">Demo Artist</td>
              <td className="p-4 text-sm text-muted-foreground">demo@example.com</td>
              <td className="p-4"><span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs">✓ Verified</span></td>
              <td className="p-4 text-sm">1,234</td>
              <td className="p-4">
                <Link href="/admin/singers/123" className="text-sm text-primary hover:underline">View</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
