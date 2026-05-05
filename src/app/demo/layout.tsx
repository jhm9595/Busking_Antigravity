'use client'

import { ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function DemoLayout({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  // Protect: only allow in demo mode or if explicitly visiting /demo
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isLoaded && !isDemoMode) {
    // Redirect away if someone tries to access /demo in production without flag
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Demo Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
        🎭 DEMO MODE - All features enabled for preview. No real transactions.
      </div>
      {children}
    </div>
  )
}
