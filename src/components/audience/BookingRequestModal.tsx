'use client'
import React, { useState } from 'react'
import { Calendar, X, Mail, Phone, MapPin } from 'lucide-react'

interface BookingRequestModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<void>
    singerName: string
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function BookingRequestModal({ isOpen, onClose, onSubmit, singerName }: BookingRequestModalProps) {
    const { t } = useLanguage()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        requesterName: '',
        contactInfo: '',
        eventType: 'wedding',
        eventDate: '',
        location: '',
        budget: '',
        message: ''
    })

    if (!isOpen) return null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.requesterName || !formData.contactInfo) return

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
            onClose()
            // Reset form?
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{t('booking.modal.title')} {singerName}</h3>
                        <p className="text-xs" style={{ color: 'var(--color-primary)' }}>{t('booking.modal.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full transition" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                            {t('booking.modal.section_contact')}
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.name_label')} <span className="text-red-500">*</span></label>
                                <input
                                    name="requesterName"
                                    value={formData.requesterName}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.name_placeholder')}
                                    className="w-full border rounded-lg p-3 outline-none transition"
                                    style={{ 
                                        backgroundColor: 'var(--color-surface)', 
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.contact_label')} <span className="text-red-500">*</span></label>
                                <input
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.contact_placeholder')}
                                    className="w-full border rounded-lg p-3 outline-none transition"
                                    style={{ 
                                        backgroundColor: 'var(--color-surface)', 
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.contact_help')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                        <h4 className="text-sm font-bold uppercase tracking-widest flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                            {t('booking.modal.section_event')}
                        </h4>

                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.type_label')}</label>
                            <select
                                name="eventType"
                                value={formData.eventType}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3 outline-none transition appearance-none"
                                style={{ 
                                    backgroundColor: 'var(--color-surface)', 
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                <option value="wedding">{t('booking.modal.types.wedding')}</option>
                                <option value="event">{t('booking.modal.types.event')}</option>
                                <option value="festival">{t('booking.modal.types.festival')}</option>
                                <option value="other">{t('booking.modal.types.other')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.date_label')}</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={formData.eventDate}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg p-3 outline-none transition text-sm"
                                        style={{ 
                                            backgroundColor: 'var(--color-surface)', 
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.budget_label')}</label>
                                <input
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.budget_placeholder')}
                                    className="w-full border rounded-lg p-3 outline-none transition text-sm"
                                    style={{ 
                                        backgroundColor: 'var(--color-surface)', 
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.location_label')}</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder={t('booking.modal.location_placeholder')}
                                className="w-full border rounded-lg p-3 outline-none transition"
                                style={{ 
                                    backgroundColor: 'var(--color-surface)', 
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('booking.modal.message_label')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={t('booking.modal.message_placeholder')}
                                rows={3}
                                className="w-full border rounded-lg p-3 outline-none transition resize-none"
                                style={{ 
                                    backgroundColor: 'var(--color-surface)', 
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                            />
                        </div>
                    </div>

                </form>

                <div className="p-4 border-t z-10" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.requesterName || !formData.contactInfo || isSubmitting}
                        className="w-full font-bold py-3.5 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{ 
                            backgroundColor: 'var(--color-primary)', 
                            color: 'var(--color-primary-foreground)',
                            boxShadow: 'var(--box-shadow)'
                        }}
                    >
                        {isSubmitting ? t('booking.modal.submitting') : t('booking.modal.submit')}
                    </button>
                    <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                        {t('booking.modal.privacy_note')}
                    </p>
                </div>
            </div>
        </div>
    )
}
