'use client'

import React, { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X, User, Edit, Save, Copy, Download, ExternalLink, LoaderCircle, Music, Video } from 'lucide-react'
import { FaFacebook, FaYoutube, FaInstagram, FaSoundcloud, FaTiktok } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { useLanguage } from '@/contexts/LanguageContext'
import { updateSingerProfile } from '@/services/singer'

interface SingerQRCardProps {
    singerId: string
    displayId: string
    nickname?: string
    avatarUrl?: string
    qrValue: string
    socialLinks?: {
        instagram?: string
        facebook?: string
        youtube?: string
        tiktok?: string
        soundcloud?: string
        twitter?: string
    }
    bio?: string
    hairColor?: string
    topColor?: string
    bottomColor?: string
    onUpdate?: () => void
}

// Helper to cleaner handle display
const getDisplayHandle = (input: string | undefined) => {
    if (!input) return ''
    let handle = input.trim()
    // Remove common URL prefixes
    handle = handle.replace(/^https?:\/\/(www\.)?/, '')
    handle = handle.replace(/^(instagram\.com|facebook\.com|youtube\.com\/@|tiktok\.com\/@|soundcloud\.com|twitter\.com)\//, '')
    // Truncate if too long (optional)
    if (handle.length > 15) handle = handle.substring(0, 15) + '...'
    return handle.startsWith('@') ? handle : '@' + handle
}

export default function SingerQRCard({ singerId, displayId, nickname, avatarUrl, qrValue, socialLinks = {}, bio = '', hairColor, topColor, bottomColor, onUpdate }: SingerQRCardProps) {
    const { t } = useLanguage()
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isFullFullscreen, setIsFullFullscreen] = useState(false)

    // Edit State
    const [formData, setFormData] = useState({
        stageName: displayId || '',
        instagram: socialLinks.instagram || '',
        facebook: socialLinks.facebook || '',
        youtube: socialLinks.youtube || '',
        tiktok: socialLinks.tiktok || '',
        soundcloud: socialLinks.soundcloud || '',
        twitter: socialLinks.twitter || '',
        bio: bio || '',
        hairColor: hairColor || 'Black',
        topColor: topColor || 'Black',
        bottomColor: bottomColor || 'Black'
    })
    const [isSaving, setIsSaving] = useState(false)

    // Refs for QR download
    const qrRef = useRef<SVGSVGElement>(null)

    const handleSaveImage = () => {
        const svg = document.getElementById('singer-qr-code')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.onload = () => {
            canvas.width = img.width + 40 // Add padding
            canvas.height = img.height + 40
            if (ctx) {
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 20, 20)
                const pngFile = canvas.toDataURL('image/png')
                const downloadLink = document.createElement('a')
                downloadLink.download = `singer-qr-${displayId}.png`
                downloadLink.href = pngFile
                downloadLink.click()
            }
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(qrValue)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        const { stageName, bio, hairColor, topColor, bottomColor, ...links } = formData

        // 1. If stageName changed, update nickname first
        if (stageName !== displayId) {
            const nickRes = await (await import('@/services/singer')).updateNickname(singerId, stageName)
            if (!nickRes.success) {
                setIsSaving(false)
                alert(nickRes.error === 'NICKNAME_DUPLICATE' ? 'This nickname is already taken.' : 'Failed to update nickname.')
                return
            }
        }

        const res = await updateSingerProfile(singerId, {
            bio: bio,
            hairColor,
            topColor,
            bottomColor,
            socialLinks: JSON.stringify(links)
        })
        setIsSaving(false)
        if (res.success) {
            setIsEditModalOpen(false)
            if (onUpdate) onUpdate()
        } else {
            alert(t('common.error'))
        }
    }


    // Helper to open social link
    const openSocial = (input: string | undefined, type: keyof typeof formData) => {
        if (!input) return
        let finalUrl = input.trim()

        // If it starts with http, assume full URL
        if (!finalUrl.startsWith('http')) {
            // Check for known domains to avoid double-prefixing if user typed "instagram.com/foo"
            if (finalUrl.includes('.')) {
                finalUrl = `https://${finalUrl}`
            } else {
                // Determine base URL based on type
                switch (type) {
                    case 'instagram': finalUrl = `https://instagram.com/${finalUrl}`; break;
                    case 'facebook': finalUrl = `https://facebook.com/${finalUrl}`; break;
                    case 'youtube': finalUrl = `https://youtube.com/@${finalUrl}`; break; // YouTube handles @ handles
                    case 'tiktok': finalUrl = `https://tiktok.com/@${finalUrl}`; break;
                    case 'soundcloud': finalUrl = `https://soundcloud.com/${finalUrl}`; break;
                    case 'twitter': finalUrl = `https://twitter.com/${finalUrl}`; break;
                    default: finalUrl = `https://${finalUrl}`;
                }
            }
        }

        window.open(finalUrl, '_blank')
    }

    return (
        <>
            {/* Profile Card */}
            <div className="bg-card rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center space-y-4 border border-border relative">
                {/* Edit Button */}
                <button
                    onClick={() => {
                        setFormData({
                            stageName: nickname || displayId || '',
                            instagram: socialLinks.instagram || '',
                            facebook: socialLinks.facebook || '',
                            youtube: socialLinks.youtube || '',
                            tiktok: socialLinks.tiktok || '',
                            soundcloud: socialLinks.soundcloud || '',
                            twitter: socialLinks.twitter || '',
                            bio: bio || '',
                            hairColor: hairColor || 'Black',
                            topColor: topColor || 'Black',
                            bottomColor: bottomColor || 'Black'
                        })
                        setIsEditModalOpen(true)
                    }}
                    className="absolute top-4 right-4 bg-muted/50 border border-border p-1.5 rounded-full shadow-sm hover:bg-muted text-muted-foreground transition-colors"
                    title={t('dashboard.profile.edit')}
                >
                    <Edit className="w-4 h-4" />
                </button>

                <h2 className="text-xl font-bold text-foreground">{t('dashboard.qr.title')}</h2>
                <p className="text-muted-foreground font-medium">{displayId}</p>
                {bio && <p className="text-muted-foreground/70 text-sm italic max-w-xs line-clamp-2">{bio}</p>}

                {/* Social Icons Row */}
                <div className="grid grid-cols-3 gap-2 w-full px-2">
                    {socialLinks.instagram && (
                        <button onClick={() => openSocial(socialLinks.instagram, 'instagram')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaInstagram className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.instagram)}</span>
                        </button>
                    )}
                    {socialLinks.youtube && (
                        <button onClick={() => openSocial(socialLinks.youtube, 'youtube')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaYoutube className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.youtube)}</span>
                        </button>
                    )}
                    {socialLinks.tiktok && (
                        <button onClick={() => openSocial(socialLinks.tiktok, 'tiktok')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaTiktok className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.tiktok)}</span>
                        </button>
                    )}
                    {socialLinks.soundcloud && (
                        <button onClick={() => openSocial(socialLinks.soundcloud, 'soundcloud')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaSoundcloud className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.soundcloud)}</span>
                        </button>
                    )}
                    {socialLinks.twitter && (
                        <button onClick={() => openSocial(socialLinks.twitter, 'twitter')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaXTwitter className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.twitter)}</span>
                        </button>
                    )}
                    {socialLinks.facebook && (
                        <button onClick={() => openSocial(socialLinks.facebook, 'facebook')} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-left group">
                            <FaFacebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-foreground font-medium truncate">{getDisplayHandle(socialLinks.facebook)}</span>
                        </button>
                    )}
                </div>

                <div className="relative cursor-pointer group" onClick={() => setIsQRModalOpen(true)}>
                    <div className="p-2 rounded-lg border-2 border-dashed border-border shadow-sm group-hover:border-[var(--color-primary)] transition-colors" style={{ backgroundColor: 'var(--color-card)' }}>
                        <QRCodeSVG
                            value={qrValue}
                            size={120}
                            level="L"
                        />
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}>
                        <ExternalLink className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                    </div>
                </div>

                <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm font-medium"
                >
                    <QrCode className="w-4 h-4" />
                    <span>{t('dashboard.qr.button')}</span>
                </button>

            </div>

            {/* QR Modal */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 backdrop-blur-sm transition-opacity"
                        style={{ backgroundColor: 'var(--color-background)', opacity: 0.9 }}
                        onClick={() => setIsQRModalOpen(false)}
                    />
                    <div className="relative rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100 flex flex-col items-center z-10 animate-in fade-in zoom-in duration-200" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                        <button
                            onClick={() => setIsQRModalOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{t('dashboard.qr.title')}</h3>

                        <div
                            className="p-4 rounded-xl border-2 border-dashed shadow-inner mb-6 cursor-zoom-in group"
                            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                            onClick={() => setIsFullFullscreen(true)}
                        >
                            {singerId ? (
                                <QRCodeSVG
                                    id="singer-qr-code"
                                    value={qrValue}
                                    size={220}
                                    level="H"
                                    includeMargin={true}
                                />
                            ) : (
                                <div className="w-[220px] h-[220px] flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                                    {t('common.loading')}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 w-full mb-4">
                            <button
                                onClick={handleSaveImage}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors"
                                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                            >
                                <Download className="w-4 h-4" />
                                {t('dashboard.qr.save_image')}
                            </button>
                            <button
                                onClick={handleCopyUrl}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors"
                                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)', opacity: 0.1 }}
                            >
                                <Copy className="w-4 h-4" />
                                {isCopied ? t('dashboard.qr.copied') : t('dashboard.qr.copy_url')}
                            </button>
                        </div>

                        <p className="font-medium text-center mb-2" style={{ color: 'var(--color-text-secondary)' }}>{displayId}</p>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 backdrop-blur-sm"
                        style={{ backgroundColor: 'var(--color-background)', opacity: 0.9 }}
                        onClick={() => setIsEditModalOpen(false)}
                    />
                    {/* WIDENED MODAL MAX WIDTH HERE from max-w-sm to max-w-lg */}
                    <div className="relative rounded-2xl shadow-2xl p-6 max-w-lg w-full z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderWidth: '1px' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('dashboard.profile.edit')}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                    {t('dashboard.profile.stage_name')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.stageName}
                                    onChange={e => setFormData({ ...formData, stageName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                    style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                    {t('common.bio_label')}
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder={t('common.bio_placeholder')}
                                    className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all min-h-[80px]"
                                    style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                />
                            </div>



 

                            <div className="border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaInstagram className="w-4 h-4" /> {t('dashboard.profile.instagram')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaYoutube className="w-4 h-4" /> {t('dashboard.profile.youtube')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.youtube}
                                        onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaTiktok className="w-4 h-4" /> {t('dashboard.profile.tiktok')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tiktok}
                                        onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaSoundcloud className="w-4 h-4" /> {t('dashboard.profile.soundcloud')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.soundcloud}
                                        onChange={e => setFormData({ ...formData, soundcloud: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaXTwitter className="w-4 h-4" /> {t('dashboard.profile.twitter')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitter}
                                        onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                        <FaFacebook className="w-4 h-4" /> {t('dashboard.profile.facebook')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.facebook}
                                        onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderWidth: '1px', borderStyle: 'solid' }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="w-full py-2 rounded-lg font-bold shadow transition-colors flex justify-center items-center gap-2"
                                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                                >
                                    {isSaving && <LoaderCircle className="w-4 h-4 animate-spin" />}
                                    {t('dashboard.profile.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Fullscreen QR Overlay */}
            {isFullFullscreen && (
                <div
                    className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setIsFullFullscreen(false)}
                >
                    <button
                        className="absolute top-5 right-5 p-2.5 text-muted-foreground hover:text-foreground rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
                        onClick={(e) => { e.stopPropagation(); setIsFullFullscreen(false) }}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col items-center justify-center w-full h-full p-6">
                        <div className="bg-white p-4 rounded-xl">
                            <QRCodeSVG
                                value={qrValue}
                                size={Math.min(
                                    typeof window !== 'undefined' ? window.innerWidth - 48 : 400,
                                    typeof window !== 'undefined' ? window.innerHeight - 140 : 400,
                                    600
                                )}
                                level="H"
                                includeMargin={true}
                                style={{ width: '100%', height: 'auto', maxWidth: 600 }}
                            />
                        </div>
                        <div className="mt-6 text-center">
                            <h2 className="text-2xl font-bold text-foreground">{nickname || displayId}</h2>
                            <p className="text-muted-foreground mt-1 text-sm animate-pulse">{t('dashboard.qr.scan')}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
