'use client'
import React, { useState, useEffect } from 'react'

export default function ClockWidget() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    if (!currentTime) return null

    return (
        <div className="hidden sm:block text-right mr-4">
            <p className="text-sm font-bold text-indigo-600">{currentTime.toLocaleTimeString()}</p>
            <p className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</p>
        </div>
    )
}
