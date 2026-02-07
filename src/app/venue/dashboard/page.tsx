'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VenueDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="p-8 text-black">
            <h1 className="text-3xl font-bold mb-4">Venue Dashboard</h1>
            <p>Manage your busking zones.</p>

            <div className="mt-8">
                <button className="bg-blue-600 text-white px-4 py-2 rounded">
                    Register New Spot
                </button>
                <div className="mt-4 p-4 border rounded bg-gray-50 h-32">
                    List of my venues...
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="mt-8 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Log Out
            </button>
        </div>
    )
}
