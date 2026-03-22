'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Music, Calendar, Navigation, MapPin, Filter, Heart } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Custom Icons Configuration
// Custom Icons Configuration using DivIcon for standard HTML/Tailwind styling
const createCustomIcon = (type: 'live' | 'scheduled') => {
    return L.divIcon({
        className: 'custom-marker',
        html: type === 'live'
            ? `<div class="relative flex items-center justify-center w-8 h-8">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-lg"></span>
               </div>`
            : `<div class="relative flex items-center justify-center w-8 h-8">
                 <span class="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white shadow-lg"></span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16], // Center the icon
        popupAnchor: [0, -10]
    })
}

const liveIcon = createCustomIcon('live')
const scheduledIcon = createCustomIcon('scheduled')
const userIcon = L.divIcon({
    className: 'user-marker',
    html: `<div class="relative flex items-center justify-center w-8 h-8">
             <span class="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-2 border-white shadow-lg ring-2 ring-green-200"></span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
})

interface Performance {
    id: string
    title: string
    locationText: string
    locationLat: number | null
    locationLng: number | null
    singerId: string
    startTime: string
    status: string
    isFollowed?: boolean
}

interface MapProps {
    performances: Performance[]
    isLoggedIn: boolean
}

// Sub-component to handle map movement
const MapController = ({ center, zoom }: { center: [number, number] | null, zoom: number }) => {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 })
        }
    }, [center, zoom, map])
    return null
}

export default function BuskingMap({ performances, isLoggedIn }: MapProps) {
    const router = useRouter()
    const { t } = useLanguage()
    const [isMounted, setIsMounted] = useState(false)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]) // Default: Seoul
    const [zoom, setZoom] = useState(13)
    const [radius, setRadius] = useState<number>(0) // 0 means "All" (no filter)
    const [filterMode, setFilterMode] = useState<'all' | 'live' | 'scheduled'>('all')
    const [showFollowedOnly, setShowFollowedOnly] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation([latitude, longitude])
                setMapCenter([latitude, longitude])
                setZoom(15)
                // Auto-set radius to 5km when locating user for better UX
                if (radius === 0) setRadius(5)
            },
            () => {
                alert('Unable to retrieve your location')
            }
        )
    }

    // Helper to calculate distance in km (Haversine formula)
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371 // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1)
        const dLon = deg2rad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c // Distance in km
        return d
    }

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180)
    }

    const filteredPerformances = performances.filter(perf => {
        // Status Filter
        if (filterMode === 'live' && perf.status !== 'live') return false
        if (filterMode === 'scheduled' && perf.status !== 'scheduled') return false

        // Followed Only Filter
        if (showFollowedOnly && !perf.isFollowed) return false

        // Location Filter
        if (!perf.locationLat || !perf.locationLng) return false

        // Radius Filter (only if radius > 0 and userLocation is set)
        if (radius > 0 && userLocation) {
            const dist = getDistanceFromLatLonInKm(userLocation[0], userLocation[1], perf.locationLat, perf.locationLng)
            return dist <= radius
        }

        return true
    })

    if (!isMounted) {
        return <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">Loading Map...</div>
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ width: '100%', height: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={mapCenter} zoom={zoom} />

                {/* User Location Marker */}
                {userLocation && (
                    <>
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>{t('explore.you_are_here')}</Popup>
                        </Marker>
                        {radius > 0 && (
                            <Circle
                                center={userLocation}
                                radius={radius * 1000}
                                pathOptions={{ color: 'var(--color-primary)', fillColor: 'var(--color-primary)', fillOpacity: 0.1 }}
                            />
                        )}
                    </>
                )}

                {/* Performance Markers */}
                {filteredPerformances.map((perf) => (
                    <Marker
                        key={perf.id}
                        position={[perf.locationLat!, perf.locationLng!]}
                        icon={perf.status === 'live' ? liveIcon : scheduledIcon}
                    >
                        <Popup>
                            <div className="min-w-[160px] p-2 text-center">
                                {perf.status === 'live' && (
                                    <div className="mb-2">
                                        <span className="bg-red-600 text-white text-xs uppercase font-bold px-2 py-1 rounded-full animate-pulse shadow-sm">
                                            {t('explore.live_now')}
                                        </span>
                                    </div>
                                )}
                                <h3 className="font-bold text-base mb-1 text-[var(--color-text-primary)] leading-snug">{perf.title}</h3>
                                <p className="text-xs text-[var(--color-text-muted)] mb-3 flex items-center justify-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(perf.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <button
                                    onClick={() => router.push(`/singer/${perf.singerId}`)}
                                    className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded hover:opacity-90 w-full flex items-center justify-center transition"
                                >
                                    {t('explore.view_artist')} <Music className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Floating Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={handleLocateMe}
                    className="bg-white p-2 rounded-full shadow-md hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition"
                    title={t('explore.locate_me')}
                >
                    <Navigation className="w-6 h-6" />
                </button>
            </div>

            {/* Responsive Filter Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-card/95 backdrop-blur-sm shadow-2xl border-t border-border pb-safe md:pb-2 md:bottom-2 md:left-2 md:right-2 md:rounded-2xl md:max-w-2xl md:mx-auto">
                {/* Drag Handle (mobile only) */}
                <div className="flex justify-center pt-2 pb-1 md:hidden">
                    <div className="w-10 h-1 bg-muted rounded-full" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 md:py-2">
                    <h4 className="font-bold text-foreground flex items-center gap-2 text-sm">
                        <Filter className="w-4 h-4 text-primary" />
                        {t('explore.filter_title')}
                    </h4>
                    <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full font-medium">
                        {filteredPerformances.length} {t('explore.found_count').replace('{count}', '').trim()}
                    </span>
                </div>

                {/* Compact Filter Controls */}
                <div className="px-4 pb-4 md:pb-3 md:flex md:gap-3 md:items-center">
                    {/* Status Toggle - Horizontal Pills */}
                    <div className="flex bg-accent p-1 rounded-xl md:flex-1">
                        {(['all', 'live', 'scheduled'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${filterMode === mode ? 'bg-card shadow-md text-primary ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t(`explore.filter_${mode}`)}
                            </button>
                        ))}
                    </div>

                    {/* Additional Filters Row */}
                    <div className="flex gap-2 mt-2 md:mt-0 md:flex-1">
                        {/* Followed Only Toggle (Only if logged in) */}
                        {isLoggedIn && (
                            <button
                                onClick={() => setShowFollowedOnly(!showFollowedOnly)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${showFollowedOnly ? 'bg-primary/10 text-primary border-primary/30' : 'bg-accent text-muted-foreground border-transparent hover:bg-accent/80'}`}
                            >
                                <Heart className={`w-3 h-3 ${showFollowedOnly ? 'fill-current' : ''}`} />
                                {t('explore.filter_followed')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
