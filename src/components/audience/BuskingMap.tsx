'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Music, Calendar, Navigation, MapPin, Filter } from 'lucide-react'

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
                 <span class="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 border-2 border-white shadow-lg"></span>
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
}

interface MapProps {
    performances: Performance[]
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

export default function BuskingMap({ performances }: MapProps) {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [mapCenter, setMapCenter] = useState<[number, number]>([37.5665, 126.9780]) // Default: Seoul
    const [zoom, setZoom] = useState(13)
    const [radius, setRadius] = useState<number>(0) // 0 means "All" (no filter)
    const [filterMode, setFilterMode] = useState<'all' | 'live' | 'scheduled'>('all')

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
        var R = 6371 // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1)
        var dLon = deg2rad(lon2 - lon1)
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        var d = R * c // Distance in km
        return d
    }

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180)
    }

    const filteredPerformances = performances.filter(perf => {
        // Status Filter
        if (filterMode === 'live' && perf.status !== 'live') return false
        if (filterMode === 'scheduled' && perf.status !== 'scheduled') return false

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
        return <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
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
                            <Popup>You are Here</Popup>
                        </Marker>
                        {radius > 0 && (
                            <Circle
                                center={userLocation}
                                radius={radius * 1000}
                                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
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
                                        <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full animate-pulse shadow-sm">
                                            Live Now
                                        </span>
                                    </div>
                                )}
                                <h3 className="font-bold text-base mb-1 text-gray-900 leading-snug">{perf.title}</h3>
                                <p className="text-xs text-gray-500 mb-3 flex items-center justify-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(perf.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <button
                                    onClick={() => router.push(`/singer/${perf.singerId}`)}
                                    className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 w-full flex items-center justify-center transition"
                                >
                                    View Artist <Music className="w-3 h-3 ml-1" />
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
                    className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-700 transition"
                    title="Find Me"
                >
                    <Navigation className="w-6 h-6" />
                </button>
            </div>

            {/* Filter Panel */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-[90%] max-w-md border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-600" />
                        Explore Filter
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {filteredPerformances.length} found
                    </span>
                </div>

                <div className="space-y-3">
                    {/* Status Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['all', 'live', 'scheduled'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`flex-1 py-1 text-xs font-bold rounded-md transition capitalize ${filterMode === mode ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Radius Slider (Only if location is set) */}
                    {userLocation ? (
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Distance Radius</span>
                                <span className="font-bold">{radius === 0 ? 'All' : `${radius} km`}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="5"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>All</span>
                                <span>50km</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 text-center py-1 bg-gray-50 rounded border border-dashed border-gray-200">
                            Click <MapPin className="w-3 h-3 inline mx-1" /> to enable filtering
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
