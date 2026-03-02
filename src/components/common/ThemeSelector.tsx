'use client'

import React, { useState } from 'react'
import { useTheme, THEMES } from '@/contexts/ThemeContext'
import { Palette, X } from 'lucide-react'

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen ? (
                <div className="theme-card p-4 flex flex-col gap-2 w-64 animate-fade-in mb-4 absolute bottom-full right-0 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-theme pb-2 mb-2">
                        <span className="font-bold text-sm tracking-wider">SELECT THEME</span>
                        <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition">
                            <X size={16} />
                        </button>
                    </div>
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`text-left text-sm py-2 px-3 rounded-lg border transition ${theme === t.id
                                    ? 'border-theme-accent text-theme-accent bg-theme-accent/10 font-bold'
                                    : 'border-transparent hover:bg-theme-bg/50 text-theme-text-muted hover:text-theme-text'
                                }`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            ) : null}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="theme-button p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                title="Change Design Style"
            >
                <Palette size={24} />
            </button>
        </div>
    )
}
