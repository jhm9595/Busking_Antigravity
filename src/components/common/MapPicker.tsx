'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, LocateFixed } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Fix default icon issue in Next.js/Webpack
const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
}

// Component to handle map clicks
function LocationMarker({ onLocationSelect, position, setPosition, readonly }: {
    onLocationSelect: (lat: number, lng: number, address?: string) => void,
    position: L.LatLng | null,
    setPosition: (pos: L.LatLng | null) => void,
    readonly?: boolean
}) {
    useMapEvents({
        click(e) {
            if (readonly) return
            setPosition(e.latlng)
            onLocationSelect(e.latlng.lat, e.latlng.lng)
        },
    })

    return position === null ? null : (
        <Marker position={position}></Marker>
    )
}

function MapController({ center }: { center: L.LatLngExpression | null }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16)
        }
    }, [center, map])
    return null
}

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void
    initialLat?: number
    initialLng?: number
    readonly?: boolean
}

function MapPicker({ onLocationSelect, initialLat, initialLng, readonly }: MapPickerProps) {
    const { t } = useLanguage()
    const defaultCenter = { lat: 37.5665, lng: 126.9780 } // Seoul City Hall

    // Fix icons on mount
    useEffect(() => {
        fixLeafletIcon()
    }, [])

    const [position, setPosition] = useState<L.LatLng | null>(
        (initialLat && initialLng) ? new L.LatLng(initialLat, initialLng) : null
    )

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression | null>(
        (initialLat && initialLng) ? [initialLat, initialLng] : [defaultCenter.lat, defaultCenter.lng]
    )

    // Mounted ref to prevent state updates on unmounted component
    const mounted = React.useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false };
    }, []);

    useEffect(() => {
        if (initialLat && initialLng) {
            const newPos = new L.LatLng(initialLat, initialLng)
            setPosition(newPos)
            setMapCenter([initialLat, initialLng])
        }
    }, [initialLat, initialLng])

    // Try to get user's current location if no initial location is provided
    useEffect(() => {
        if (!initialLat && !initialLng && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (mounted.current) {
                        setMapCenter([pos.coords.latitude, pos.coords.longitude])
                    }
                },
                (err) => {
                    console.warn('Geolocation access denied or failed:', err)
                },
                { enableHighAccuracy: false, timeout: 5000 }
            )
        }
    }, [initialLat, initialLng])

    const handleSearch = async (e?: React.SyntheticEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setHasSearched(false)
        setSearchResults([])

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'BuskingApp/1.0',
                    'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8'
                }
            })

            if (!response.ok) {
                throw new Error(`Search request failed: ${response.status}`)
            }

            const data = await response.json()

            if (mounted.current) {
                setSearchResults(data)
                setHasSearched(true)
            }
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            // Always stop loading, even if thought unmounted (better UX than stuck)
            if (mounted.current) {
                setIsSearching(false)
            } else {
                // Even if unmounted, forcing state update here might throw, but skipping it ensures stuck state if ref is wrong.
                // We'll trust the ref.
            }
        }
    }

    const selectResult = (result: any) => {
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)
        const newPos = new L.LatLng(lat, lng)

        setPosition(newPos)
        setMapCenter([lat, lng])
        onLocationSelect(lat, lng, result.display_name)
        setSearchResults([]) // Clear results after selection
        setSearchQuery(result.display_name) // Set query to selected name
        setHasSearched(false)
    }

    const handleGoToMyLocation = () => {
        if (!navigator.geolocation) {
            alert(t('performance.form.map_no_geolocation') || 'Geolocation is not supported by your browser')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (mounted.current) {
                    const lat = pos.coords.latitude
                    const lng = pos.coords.longitude
                    const newPos = new L.LatLng(lat, lng)
                    setPosition(newPos)
                    setMapCenter([lat, lng])
                    onLocationSelect(lat, lng)
                }
            },
            (err) => {
                console.warn('Geolocation access denied or failed:', err)
                if (mounted.current) {
                    alert(t('performance.form.map_geolocation_error') || 'Unable to retrieve your location')
                }
            },
            { enableHighAccuracy: true, timeout: 5000 }
        )
    }

    return (
        <div style={{ position: 'relative', height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {/* Search Bar Overlay */}
            {!readonly && (
                <div className="absolute top-2 left-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-md shadow-md p-2 transition-all">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSearch()
                                }
                            }}
                            placeholder={t('performance.form.map_search_placeholder')}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={() => handleSearch()}
                            disabled={isSearching}
                            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            title={t('performance.form.map_search_button')}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleGoToMyLocation}
                            className="p-1.5 bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors border border-gray-300"
                            title={t('performance.form.map_my_location') || '내 위치로 이동'}
                        >
                            <LocateFixed className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <ul className="mt-2 max-h-40 overflow-y-auto border-t border-gray-100 divide-y divide-gray-100 bg-white rounded-md shadow-inner">
                            {searchResults.map((result: any, index: number) => (
                                <li key={index}>
                                    <button
                                        onClick={() => selectResult(result)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 hover:text-indigo-700 transition-colors truncate"
                                    >
                                        {result.display_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {isSearching && <p className="text-xs text-gray-500 mt-2 px-1 animate-pulse">{t('performance.form.map_searching')}</p>}
                    {!isSearching && hasSearched && searchResults.length === 0 && (
                        <p className="text-xs text-red-500 mt-2 px-1">{t('performance.form.map_no_results')}</p>
                    )}
                </div>
            )}

            <MapContainer
                center={mapCenter as L.LatLngExpression}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} />
                <LocationMarker
                    onLocationSelect={onLocationSelect}
                    position={position}
                    setPosition={setPosition}
                    readonly={readonly}
                />
            </MapContainer>
        </div>
    )
}

export default React.memo(MapPicker)
