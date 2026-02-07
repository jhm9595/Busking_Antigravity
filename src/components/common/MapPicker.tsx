'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default icon issue in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Component to handle map clicks
function LocationMarker({ onLocationSelect, readonly }: { onLocationSelect: (lat: number, lng: number) => void, readonly?: boolean }) {
    const [position, setPosition] = useState<L.LatLng | null>(null)

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

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void
    initialLat?: number
    initialLng?: number
    readonly?: boolean
}

function MapPicker({ onLocationSelect, initialLat, initialLng, readonly }: MapPickerProps) {
    const defaultCenter = { lat: 37.5665, lng: 126.9780 } // Seoul City Hall
    const center = (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : defaultCenter

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker onLocationSelect={onLocationSelect} readonly={readonly} />
                {initialLat && initialLng && <Marker position={[initialLat, initialLng]} />}
            </MapContainer>
        </div>
    )
}

export default React.memo(MapPicker)
