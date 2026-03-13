'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { LogOut } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'

export default function AppHeader() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()

    const isSingerPage = pathname.startsWith('/singer') || pathname.startsWith('/live')

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition-opacity">
                        miniMic
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                    {isLoaded && user && isSingerPage && (
                        <button
                            onClick={handleLogout}
                            className="p-3 md:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-lg hover:bg-accent transition-all active:scale-95 touch-manipulation text-foreground"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 md:w-4 md:h-4 text-primary" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
