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

export default function SingerQRCard({ singerId, displayId, qrValue, socialLinks = {}, bio = '', hairColor, topColor, bottomColor, onUpdate }: SingerQRCardProps) {
    const { t } = useLanguage()
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    // Edit State
    const [formData, setFormData] = useState({
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
        const { bio, hairColor, topColor, bottomColor, ...links } = formData
        const res = await updateSingerProfile(singerId, {
            bio: bio,
            hairColor,
            topColor,
            bottomColor,
            socialLinks: links
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
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center text-center space-y-4 border border-gray-100">
                <div className="relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-1 overflow-hidden">
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                    {/* Edit Button */}
                    <button
                        onClick={() => {
                            setFormData({
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
                        className="absolute -bottom-1 -right-1 bg-white border border-gray-200 p-1.5 rounded-full shadow hover:bg-gray-50 text-gray-500"
                        title={t('dashboard.profile.edit')}
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                </div>

                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.qr.title')}</h2>
                <p className="text-gray-500 font-medium">{displayId}</p>
                {bio && <p className="text-gray-400 text-sm italic max-w-xs line-clamp-2">{bio}</p>}

                {/* Social Icons Row */}
                <div className="grid grid-cols-3 gap-2 w-full px-2">
                    {socialLinks.instagram && (
                        <button onClick={() => openSocial(socialLinks.instagram, 'instagram')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaInstagram className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.instagram)}</span>
                        </button>
                    )}
                    {socialLinks.youtube && (
                        <button onClick={() => openSocial(socialLinks.youtube, 'youtube')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaYoutube className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.youtube)}</span>
                        </button>
                    )}
                    {socialLinks.tiktok && (
                        <button onClick={() => openSocial(socialLinks.tiktok, 'tiktok')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaTiktok className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.tiktok)}</span>
                        </button>
                    )}
                    {socialLinks.soundcloud && (
                        <button onClick={() => openSocial(socialLinks.soundcloud, 'soundcloud')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaSoundcloud className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.soundcloud)}</span>
                        </button>
                    )}
                    {socialLinks.twitter && (
                        <button onClick={() => openSocial(socialLinks.twitter, 'twitter')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaXTwitter className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.twitter)}</span>
                        </button>
                    )}
                    {socialLinks.facebook && (
                        <button onClick={() => openSocial(socialLinks.facebook, 'facebook')} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-left group">
                            <FaFacebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 font-medium truncate">{getDisplayHandle(socialLinks.facebook)}</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm font-medium"
                >
                    <QrCode className="w-4 h-4" />
                    <span>{t('dashboard.qr.button')}</span>
                </button>
            </div>

            {/* QR Modal */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsQRModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100 flex flex-col items-center z-10 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsQRModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.qr.title')}</h3>

                        <div className="p-4 bg-white rounded-xl border-2 border-dashed border-gray-200 shadow-inner mb-6">
                            {singerId ? (
                                <QRCodeSVG
                                    id="singer-qr-code"
                                    value={qrValue}
                                    size={220}
                                    level="H"
                                    includeMargin={true}
                                />
                            ) : (
                                <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg">
                                    {t('common.loading')}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 w-full mb-4">
                            <button
                                onClick={handleSaveImage}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {t('dashboard.qr.save_image')}
                            </button>
                            <button
                                onClick={handleCopyUrl}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                {isCopied ? t('dashboard.qr.copied') : t('dashboard.qr.copy_url')}
                            </button>
                        </div>

                        <p className="text-gray-600 font-medium text-center mb-2">{displayId}</p>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsEditModalOpen(false)}
                    />
                    {/* WIDENED MODAL MAX WIDTH HERE from max-w-sm to max-w-lg */}
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full z-10 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{t('dashboard.profile.edit')}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('common.bio_label')}
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder={t('common.bio_placeholder')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                                />
                            </div>



                            <div className="border-t border-gray-100 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaInstagram className="w-4 h-4 text-pink-600" /> {t('dashboard.profile.instagram')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaYoutube className="w-4 h-4 text-red-600" /> {t('dashboard.profile.youtube')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.youtube}
                                        onChange={e => setFormData({ ...formData, youtube: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaTiktok className="w-4 h-4 text-black" /> {t('dashboard.profile.tiktok')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tiktok}
                                        onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaSoundcloud className="w-4 h-4 text-orange-500" /> {t('dashboard.profile.soundcloud')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.soundcloud}
                                        onChange={e => setFormData({ ...formData, soundcloud: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaXTwitter className="w-4 h-4 text-black" /> {t('dashboard.profile.twitter')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitter}
                                        onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <FaFacebook className="w-4 h-4 text-blue-600" /> {t('dashboard.profile.facebook')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.facebook}
                                        onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                        placeholder={t('dashboard.profile.placeholder_id')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow transition-colors flex justify-center items-center gap-2"
                                >
                                    {isSaving && <LoaderCircle className="w-4 h-4 animate-spin" />}
                                    {t('dashboard.profile.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
