'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Save, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

function MapSelector({ setLat, setLng }: { setLat: any; setLng: any }) {
  const L = require('leaflet')
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const map = L.map('venue-map')
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    
    map.on('click', (e: any) => {
      setLat(e.latlng.lat)
      setLng(e.latlng.lng)
    })
    
    return () => { map.remove() }
  }, [])
  
  return null
}

export default function VenueRegistrationPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!name || !address) return
    
    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('venues')
        .insert([{ name, address, lat, lng, description }])
        .select()
      
      if (error) throw error
      
      alert(t('venue.registration.success') || 'Venue registered!')
      router.push('/venue/dashboard')
    } catch (error: any) {
      console.error('Venue registration error:', error)
      alert(t('venue.registration.error') || 'Failed to register')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-green-500" />
          {t('venue.registration.title') || 'Register Venue'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-3xl border border-border">
          <div>
            <label className="block text-sm font-bold mb-2">{t('venue.registration.name') || 'Venue Name'}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
              placeholder={t('venue.registration.name_placeholder') || 'Enter venue name'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">{t('venue.registration.address') || 'Address'}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
              placeholder={t('venue.registration.address_placeholder') || 'Enter address'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">{t('venue.registration.description') || 'Description'}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm min-h-[100px]"
              placeholder={t('venue.registration.description_placeholder') || 'Describe the venue'}
            />
          </div>
          
          <div className="rounded-xl border border-border overflow-hidden">
            <p className="p-3 text-sm text-muted-foreground bg-card/50">
              {lat && lng ? `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Click on the map to select location'}
            </p>
            <div id="venue-map" className="h-64">
              {/* Map will be initialized by Leaflet directly */}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !name || !address}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4 animate-spin" />
                {t('common.loading') || 'Loading...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {t('venue.registration.submit') || 'Register Venue'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
