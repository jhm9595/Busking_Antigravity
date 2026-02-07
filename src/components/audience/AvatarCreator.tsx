'use client'
import React, { useState } from 'react'
import PixelAvatar, { AvatarConfig } from './PixelAvatar'
import { ChevronRight, ChevronLeft, Shuffle } from 'lucide-react'

interface AvatarCreatorProps {
    onComplete: (nickname: string, avatarConfig: AvatarConfig | null, userType: 'anon' | 'named') => void
}

const HAIR_COLORS = [
    '#090806', // Black
    '#2c222b', // Dark Brown
    '#71635a', // Light Brown
    '#FCD34D', // Blonde
    '#d6c4c2', // Platinum Blonde
    '#ca3b1a', // Red
    '#8d5524', // Medium Brown
    '#4a4a4a'  // Grey
]

const CLOTHING_COLORS = [
    '#2c3e50', // Navy
    '#8e44ad', // Purple
    '#2980b9', // Blue
    '#27ae60', // Green
    '#f1c40f', // Yellow
    '#e67e22', // Orange
    '#e74c3c', // Red
    '#ecf0f1'  // White
]

const SKIN_COLORS = ['#f0c0a8', '#fcebe6', '#5d4037', '#8d5524']

const USER_TYPES = [
    { id: 'named', label: 'Use Nickname' },
    { id: 'anon', label: 'Anonymous' }
]

export default function AvatarCreator({ onComplete }: AvatarCreatorProps) {
    const [nickname, setNickname] = useState('')
    const [userType, setUserType] = useState<'anon' | 'named'>('named')
    const [useAvatar, setUseAvatar] = useState(true)

    // Avatar State
    const [config, setConfig] = useState<AvatarConfig>({
        skinColor: '#f0c0a8',
        hairStyle: 1,
        hairColor: '#8d5524',
        hatStyle: 0,
        hatColor: '#34495e',
        faceExpression: 0,
        topStyle: 0,
        topColor: '#3498db',
        bottomStyle: 0,
        bottomColor: '#34495e'
    })

    const randomize = () => {
        const randItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
        const randInt = (max: number) => Math.floor(Math.random() * (max + 1))

        setConfig({
            skinColor: randItem(SKIN_COLORS),
            hairStyle: randInt(3),
            hairColor: randItem(HAIR_COLORS),
            hatStyle: 0,
            hatColor: '#000000',
            faceExpression: randInt(2),
            topStyle: randInt(2),
            topColor: randItem(CLOTHING_COLORS),
            bottomStyle: randInt(2),
            bottomColor: randItem(CLOTHING_COLORS)
        })
    }

    const Controls = ({ label, value, max, onChange, colorMode = false, palette = CLOTHING_COLORS }: any) => (
        <div className="flex flex-col mb-3">
            <span className="text-xs text-gray-400 uppercase font-bold mb-1">{label}</span>
            <div className="flex items-center space-x-2">
                {!colorMode && (
                    <>
                        <button
                            onClick={() => onChange(value <= 0 ? max : value - 1)}
                            className="p-1 bg-gray-800 rounded hover:bg-gray-700"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <span className="flex-1 text-center font-mono text-sm">{value}</span>
                        <button
                            onClick={() => onChange(value >= max ? 0 : value + 1)}
                            className="p-1 bg-gray-800 rounded hover:bg-gray-700"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </>
                )}
                {colorMode && (
                    <div className="flex flex-wrap gap-1">
                        {palette.slice(0, 8).map((c: string) => (
                            <button
                                key={c}
                                className={`w-6 h-6 rounded-full border-2 ${value === c ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => onChange(c)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    const handleSubmit = () => {
        const finalName = userType === 'anon' ? 'Anonymous' : (nickname.trim() || 'Guest')
        const finalConfig = useAvatar ? config : null
        onComplete(finalName, finalConfig, userType)
    }

    return (
        <div className="w-full max-w-md bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Join Live</h2>
                <button onClick={randomize} className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center">
                    <Shuffle className="w-4 h-4 mr-1" /> Random
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Identity Section */}
                <div className="mb-6 bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <div className="flex space-x-2 mb-3">
                        {USER_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setUserType(t.id as any)
                                    if (t.id === 'anon') setUseAvatar(false)
                                    else setUseAvatar(true)
                                }}
                                className={`flex-1 py-1.5 text-sm rounded font-bold transition ${userType === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {userType === 'named' && (
                        <input
                            type="text"
                            placeholder="Enter Nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    )}
                </div>

                {/* Avatar Section - Only show if not anonymous */}
                {userType !== 'anon' && (
                    <div className="mb-4">
                        <label className="flex items-center mb-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useAvatar}
                                onChange={(e) => setUseAvatar(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-300 font-bold">Create Avatar</span>
                        </label>

                        {useAvatar && (
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Preview */}
                                <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 self-start sm:w-1/3">
                                    <PixelAvatar config={config} size={96} className="drop-shadow-xl" />
                                    <p className="mt-2 text-center text-xs text-gray-500 font-mono">My Avatar</p>
                                </div>

                                {/* Controls Grid */}
                                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                                    <Controls label="Face" max={2}
                                        value={config.faceExpression}
                                        onChange={(v: number) => setConfig({ ...config, faceExpression: v })}
                                    />
                                    <Controls label="Skin" colorMode palette={SKIN_COLORS}
                                        value={config.skinColor}
                                        onChange={(v: string) => setConfig({ ...config, skinColor: v })}
                                    />

                                    <Controls label="Hair Style" max={3}
                                        value={config.hairStyle}
                                        onChange={(v: number) => setConfig({ ...config, hairStyle: v })}
                                    />
                                    <Controls label="Hair Color" colorMode palette={HAIR_COLORS}
                                        value={config.hairColor}
                                        onChange={(v: string) => setConfig({ ...config, hairColor: v })}
                                    />

                                    <Controls label="Top Style" max={2}
                                        value={config.topStyle}
                                        onChange={(v: number) => setConfig({ ...config, topStyle: v })}
                                    />
                                    <Controls label="Top Color" colorMode
                                        value={config.topColor}
                                        onChange={(v: string) => setConfig({ ...config, topColor: v })}
                                    />
                                    <Controls label="Bottom Style" max={2}
                                        value={config.bottomStyle}
                                        onChange={(v: number) => setConfig({ ...config, bottomStyle: v })}
                                    />
                                    <Controls label="Bottom Color" colorMode
                                        value={config.bottomColor}
                                        onChange={(v: string) => setConfig({ ...config, bottomColor: v })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-850">
                <button
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/40 transition transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Enter Live Performance
                </button>
            </div>
        </div>
    )
}
