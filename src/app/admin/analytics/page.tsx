'use client'

import { BarChart3, Users, Music, DollarSign } from 'lucide-react'

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
       
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-muted-foreground">Total Users</span>
          </div>
          <p className="text-3xl font-bold">1,234</p>
        </div>
         
        <div className="bg-card p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-6 h-6 text-green-400" />
            <span className="text-sm text-muted-foreground">Active Performances</span>
          </div>
          <p className="text-3xl font-bold">56</p>
        </div>
         
        <div className="bg-card p-6 rounded-3xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <p className="text-3xl font-bold">₩ 1,234,000</p>
        </div>
      </div>
      
      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="text-xl font-bold mb-4">Performance Trends</h3>
        <div className="h-64 bg-card/50 rounded-xl flex items-center justify-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50" />
          <span className="ml-2">Chart placeholder - integrate recharts or chart library</span>
        </div>
      </div>
    </div>
  )
}
