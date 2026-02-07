'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { List, Map as MapIcon, LogOut } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'

// Dynamically import Map to avoid SSR issues with Leaflet
const BuskingMap = dynamic(() => import('@/components/audience/BuskingMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
})

interface Performance {
    id: string
    title: string
    locationText: string
    locationLat: number | null
    locationLng: number | null
    startTime: string
    status: string
    chatEnabled: boolean
    singerId: string
    isFollowed?: boolean
}

interface Singer {
    id: string
    stageName: string
    profile: {
        avatarUrl: string | null
    }
}

export default function ExplorePage() {
    const router = useRouter()
    const { signOut } = useClerk()
    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
    const [performances, setPerformances] = useState<Performance[]>([])
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followedSingers, setFollowedSingers] = useState<Singer[]>([])

    const fetchFollowing = async () => {
        const fanId = localStorage.getItem('busking_fan_id')
        if (!fanId) return
        try {
            const res = await fetch(`/api/fans/${fanId}/following`)
            if (res.ok) {
                const data = await res.json()
                setFollowedSingers(data)
                setShowFollowingModal(true)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        async function fetchPerformances() {
            try {
                const fanId = localStorage.getItem('busking_fan_id')
                const res = await fetch(`/api/performances${fanId ? `?fanId=${fanId}` : ''}`)
                if (res.ok) {
                    const data = await res.json()
                    setPerformances(data)
                }
            } catch (error) {
                console.error('Failed to fetch performances', error)
            }
        }
        fetchPerformances()
    }, [])

    const handleLogout = async () => {
        await signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="h-screen flex flex-col bg-white text-black">
            <header className="flex justify-between items-center p-4 border-b bg-white z-10 shadow-sm">
                <h1 className="text-2xl font-bold text-indigo-700">Explore Busking</h1>
                <div className="flex space-x-2">
                    <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-2 rounded-md flex items-center ${viewMode === 'map' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <MapIcon className="w-5 h-5 mr-1" /> Map
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md flex items-center ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <List className="w-5 h-5 mr-1" /> List
                        </button>
                    </div>
                    <button
                        onClick={fetchFollowing}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-sm hover:bg-indigo-100 font-bold transition flex items-center"
                    >
                        Following
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center text-gray-600"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                {viewMode === 'map' ? (
                    <div className="h-full w-full">
                        <BuskingMap performances={performances} />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {performances.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 mt-10">No performances found.</p>
                            ) : (
                                performances.map((perf) => (
                                    <div key={perf.id} className={`border rounded-xl p-4 hover:shadow-lg transition bg-white block cursor-pointer relative ${perf.isFollowed ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/30' : ''}`} onClick={() => router.push(`/singer/${perf.singerId}`)}>
                                        {perf.isFollowed && (
                                            <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                                                Following
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2 pr-12">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${perf.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-800'}`}>
                                                {perf.status === 'live' ? 'LIVE NOW' : 'Scheduled'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(perf.startTime).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{perf.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4">{perf.locationText}</p>
                                        <button className="w-full py-2 border border-indigo-600 text-indigo-600 rounded font-medium hover:bg-indigo-50">
                                            View Details
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Following Modal */}
            {showFollowingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
                            <h3 className="text-lg font-bold text-indigo-900">Following Artists</h3>
                            <button onClick={() => setShowFollowingModal(false)} className="text-gray-500 hover:text-indigo-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {followedSingers.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">You are not following any artists yet.</p>
                            ) : (
                                followedSingers.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            router.push(`/singer/${s.id}`)
                                            setShowFollowingModal(false)
                                        }}
                                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 overflow-hidden border border-gray-300">
                                            {s.profile?.avatarUrl ? (
                                                <img src={s.profile.avatarUrl} alt={s.stageName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-indigo-600">{s.stageName[0]}</span>
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-800">{s.stageName}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
