'use client'
import React, { useState, useEffect } from 'react'
import PixelAvatar, { AvatarConfig } from './PixelAvatar'
import { Shuffle, User, Palette, Shirt, Smile, ChevronRight, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface AvatarCreatorProps {
    onComplete: (nickname: string, avatarConfig: AvatarConfig | null, userType: 'anon' | 'named') => void
}

// Compact palette with representative colors (6 each)
const HAIR_COLORS = ['#090806', '#71635a', '#FCD34D', '#ca3b1a', '#8d5524', '#4a4a4a']
const TOP_COLORS = ['#2c3e50', '#8e44ad', '#2980b9', '#27ae60', '#f1c40f', '#e74c3c']
const BOTTOM_COLORS = ['#34495e', '#2c3e50', '#1a1a1a', '#27ae60', '#d35400', '#ecf0f1']
const SKIN_COLORS = ['#f0c0a8', '#fcebe6', '#e0ac69', '#8d5524', '#5d4037']

export default function AvatarCreator({ onComplete }: AvatarCreatorProps) {
    const { t } = useLanguage()
    const [nickname, setNickname] = useState('')
    const [userType, setUserType] = useState<'anon' | 'named'>('named')
    const [activeTab, setActiveTab] = useState<'face' | 'clothes' | 'colors'>('face')

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
            topColor: randItem(TOP_COLORS),
            bottomStyle: randInt(2),
            bottomColor: randItem(BOTTOM_COLORS)
        })
    }

    useEffect(() => { randomize() }, [])

    const handleComplete = () => {
        const finalName = userType === 'anon' ? t('avatar.anonymous') : (nickname.trim() || 'Guest')
        onComplete(finalName, config, userType)
    }

    const CategoryTab = ({ id, icon: Icon, label }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${activeTab === id ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-400'}`}
        >
            <Icon className={`w-5 h-5 ${activeTab === id ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
            {activeTab === id && <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1" />}
        </button>
    )

    const OptionGrid = ({ label, items, value, onChange, isColor = false }: any) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map((item: any, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => onChange(isColor ? item : idx)}
                        className={`transition-all duration-300 relative ${isColor
                            ? 'w-7 h-7 rounded-full border-2 hover:scale-110 shadow-sm'
                            : 'px-3 py-1.5 bg-gray-800 rounded-xl text-[10px] font-black border border-white/5 hover:bg-gray-700 uppercase italic'
                            } ${isColor
                                ? (value === item ? 'border-white scale-110 shadow-md shadow-white/20' : 'border-transparent')
                                : (value === idx ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20' : '')
                            }`}
                        style={isColor ? { backgroundColor: item } : {}}
                    >
                        {!isColor && (idx === 0 ? t('avatar.options.none') : t('avatar.options.style_label').replace('{n}', idx.toString()))}
                        {isColor && value === item && <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow-md" />}
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div className="w-full max-w-sm bg-gray-950 rounded-[40px] border border-white/5 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
            {/* 1. PREVIEW CARD */}
            <div className="p-6 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent relative">
                <button
                    onClick={randomize}
                    className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-indigo-400 transition-all active:rotate-180 duration-500"
                    title={t('avatar.random')}
                >
                    <Shuffle className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all duration-700" />
                        <div className="relative bg-gray-900/80 p-5 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-sm">
                            <PixelAvatar config={config} size={100} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col items-center gap-2 w-full">
                        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-full max-w-[240px]">
                            <button
                                onClick={() => setUserType('named')}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${userType === 'named' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t('avatar.use_nickname')}
                            </button>
                            <button
                                onClick={() => setUserType('anon')}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${userType === 'anon' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t('avatar.anonymous')}
                            </button>
                        </div>
                        {userType === 'named' && (
                            <input
                                type="text"
                                maxLength={12}
                                placeholder={t('avatar.nickname_placeholder')}
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="mt-1 w-48 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 text-center text-white text-base font-black outline-none py-1 transition-all placeholder:text-gray-800 italic"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 2. CATEGORY TABS */}
            <div className="flex px-4 bg-gray-950/80 border-y border-white/5">
                <CategoryTab id="face" icon={Smile} label="Style" />
                <CategoryTab id="clothes" icon={Shirt} label="Outfit" />
                <CategoryTab id="colors" icon={Palette} label="Palette" />
            </div>

            {/* 3. SETTINGS SHEET */}
            <div className="p-6 h-60 overflow-y-auto custom-scrollbar bg-gray-950/40">
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                    {activeTab === 'face' && (
                        <>
                            <OptionGrid label={t('avatar.options.expression')} items={[0, 1, 2]} value={config.faceExpression} onChange={(v: number) => setConfig({ ...config, faceExpression: v })} />
                            <OptionGrid label={t('avatar.options.hair')} items={[0, 1, 2, 3]} value={config.hairStyle} onChange={(v: number) => setConfig({ ...config, hairStyle: v })} />
                        </>
                    )}
                    {activeTab === 'clothes' && (
                        <>
                            <OptionGrid label={t('avatar.options.top')} items={[0, 1, 2]} value={config.topStyle} onChange={(v: number) => setConfig({ ...config, topStyle: v })} />
                            <OptionGrid label={t('avatar.options.bottom')} items={[0, 1, 2]} value={config.bottomStyle} onChange={(v: number) => setConfig({ ...config, bottomStyle: v })} />
                        </>
                    )}
                    {activeTab === 'colors' && (
                        <div className="grid grid-cols-1 gap-6">
                            <OptionGrid label={t('avatar.options.skin_color')} items={SKIN_COLORS} value={config.skinColor} onChange={(v: string) => setConfig({ ...config, skinColor: v })} isColor />
                            <OptionGrid label={t('avatar.options.hair_color')} items={HAIR_COLORS} value={config.hairColor} onChange={(v: string) => setConfig({ ...config, hairColor: v })} isColor />
                            <div className="grid grid-cols-2 gap-4">
                                <OptionGrid label={t('avatar.options.top_color')} items={TOP_COLORS} value={config.topColor} onChange={(v: string) => setConfig({ ...config, topColor: v })} isColor />
                                <OptionGrid label={t('avatar.options.bottom_color')} items={BOTTOM_COLORS} value={config.bottomColor} onChange={(v: string) => setConfig({ ...config, bottomColor: v })} isColor />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. FOOTER ACTION */}
            <div className="p-6 bg-gray-950">
                <button
                    onClick={handleComplete}
                    className="w-full bg-white text-black py-4 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                    {t('avatar.enter_button')}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    )
}
