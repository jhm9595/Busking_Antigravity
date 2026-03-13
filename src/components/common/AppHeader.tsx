'use client'

import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'

export default function AppHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-black italic tracking-tighter hover:opacity-80 transition-opacity">
                        ANTIGRAVITY.
                    </Link>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                </div>
            </div>
        </header>
    )
}
