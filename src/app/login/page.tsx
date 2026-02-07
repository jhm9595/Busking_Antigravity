'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Music, Building2, Ticket } from 'lucide-react'
import clsx from 'clsx'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [role, setRole] = useState<'audience' | 'singer' | 'venue'>('audience')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) {
            alert(error.message)
        } else {
            router.push('/')
        }
        setLoading(false)
    }

    const handleSignUp = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role,
                },
            },
        })
        if (error) {
            alert(error.message)
        } else {
            alert('Check your email for the confirmation link!')
        }
        setLoading(false)
    }

    const handleOAuth = async (provider: 'google' | 'kakao' | 'azure') => {
        try {
            console.log(`Checking env: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL OK' : 'URL Missing'}`)

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })

            if (error) {
                console.error('Supabase OAuth Error:', error)
                alert(`Login Failed: ${error.message}`)
            }
        } catch (e: any) {
            console.error('Unexpected Error:', e)
            alert(`An unexpected error occurred: ${e.message}`)
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-900 bg-[url('/bg-pattern.svg')] bg-cover text-white">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
                <div className="text-center">
                    <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-5xl font-extrabold text-transparent">
                        BuskerKing
                    </h1>
                    <p className="mt-2 text-gray-300">Join the street performance revolution</p>
                </div>

                <div className="flex justify-center space-x-4">
                    <RoleButton
                        current={role}
                        target="audience"
                        setRole={setRole}
                        icon={<Ticket className="h-6 w-6" />}
                        label="Audience"
                    />
                    <RoleButton
                        current={role}
                        target="singer"
                        setRole={setRole}
                        icon={<Music className="h-6 w-6" />}
                        label="Singer"
                    />
                    <RoleButton
                        current={role}
                        target="venue"
                        setRole={setRole}
                        icon={<Building2 className="h-6 w-6" />}
                        label="Venue"
                    />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Log In'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="flex-1 rounded-lg border border-white/20 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-[#1a1a2e] px-2 text-gray-400">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <SocialButton provider="google" onClick={() => handleOAuth('google')} label="Google" color="bg-white text-black hover:bg-gray-100" />
                    <SocialButton provider="kakao" onClick={() => handleOAuth('kakao')} label="Kakao" color="bg-[#FEE500] text-black hover:bg-[#FDD835]" />
                    <SocialButton provider="naver" onClick={() => handleOAuth('azure')} label="Naver" color="bg-[#03C75A] text-white hover:bg-[#02b351]" />
                </div>
            </div>
        </div>
    )
}

function RoleButton({ current, target, setRole, icon, label }: any) {
    const isSelected = current === target
    return (
        <button
            type="button"
            onClick={() => setRole(target)}
            className={clsx(
                "flex flex-col items-center justify-center rounded-xl p-3 transition-all duration-200 w-24",
                isSelected
                    ? "bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-400"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
        >
            {icon}
            <span className="mt-1 text-xs font-medium">{label}</span>
        </button>
    )
}

function SocialButton({ provider, onClick, label, color }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx("flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition shadow-sm", color)}
        >
            {label}
        </button>
    )
}
