import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()

        // Demo user credentials (stored in environment for security)
        const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@minimic.app'
        const demoPassword = process.env.DEMO_USER_PASSWORD || 'demo-password-123'

        // Sign in as demo user
        const { data, error } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
        })

        if (error) {
            console.error('Demo login error:', error.message)
            return NextResponse.redirect(new URL('/login?error=demo_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
        }

        // Ensure demo data exists
        try {
            const demoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ensure' })
            })
            if (!demoResponse.ok) {
                console.warn('Demo data setup warning - continuing anyway')
            }
        } catch (e) {
            // Non-blocking - demo data setup is optional
            console.warn('Demo data setup skipped:', e)
        }

        // Redirect to singer dashboard
        return NextResponse.redirect(new URL('/singer/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    } catch (error) {
        console.error('Demo auth error:', error)
        return NextResponse.redirect(new URL('/login?error=demo_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }
}
