'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { LogOut } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import styles from './AppHeader.module.css'

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
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logoSection}>
                    <Link href="/" className={styles.logo}>
                        miniMic
                    </Link>
                </div>
                <div className={styles.actions}>
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                    {isLoaded && user && isSingerPage && (
                        <button
                            onClick={handleLogout}
                            className={styles.iconButton}
                            title="Logout"
                        >
                            <LogOut />
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
