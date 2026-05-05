'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function VenueDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const { t } = useLanguage()
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVenues() {
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setVenues(data || [])
      } catch (err) {
        console.error('Failed to load venues:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVenues()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm(t('venue.dashboard.confirm_delete'))) return
    
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setVenues(venues.filter(v => v.id !== id))
    } catch (err) {
      console.error('Failed to delete venue:', err)
      alert(t('venue.dashboard.delete_error'))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="p-8 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🏟 Venue Dashboard</h1>
        <button
          onClick={handleLogout}
          className="mt-8 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
      <p>Manage your busking zones.</p>

      <div className="mt-8">
        <Link href="/venue/register" className="inline-block mb-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register New Spot
          </button>
        </Link>

        {loading ? (
          <div className="p-4 border rounded bg-gray-50 h-32 flex items-center justify-center">
            Loading venues...
          </div>
        ) : (
          <div className="border rounded bg-card overflow-hidden">
            {venues.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No venues registered yet.
              </div>
            ) : (
              <ul className="divide-y">
                {venues.map((venue) => (
                  <li key={venue.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{venue.name}</h3>
                      <p className="text-sm text-gray-500">{venue.address}</p>
                      {venue.is_verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(venue.id)}
                      className="p-2 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
