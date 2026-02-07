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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center bg-indigo-900/10">
                    <div>
                        <h3 className="font-bold text-white text-lg">{t('booking.modal.title')} {singerName}</h3>
                        <p className="text-xs text-indigo-400">{t('booking.modal.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                            {t('booking.modal.section_contact')}
                        </h4>

                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.name_label')} <span className="text-red-500">*</span></label>
                                <input
                                    name="requesterName"
                                    value={formData.requesterName}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.name_placeholder')}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.contact_label')} <span className="text-red-500">*</span></label>
                                <input
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.contact_placeholder')}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">{t('booking.modal.contact_help')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-4 space-y-4">
                        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center">
                            <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                            {t('booking.modal.section_event')}
                        </h4>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.type_label')}</label>
                            <select
                                name="eventType"
                                value={formData.eventType}
                                onChange={handleChange}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition appearance-none"
                            >
                                <option value="wedding">{t('booking.modal.types.wedding')}</option>
                                <option value="event">{t('booking.modal.types.event')}</option>
                                <option value="festival">{t('booking.modal.types.festival')}</option>
                                <option value="other">{t('booking.modal.types.other')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.date_label')}</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={formData.eventDate}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.budget_label')}</label>
                                <input
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    placeholder={t('booking.modal.budget_placeholder')}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.location_label')}</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder={t('booking.modal.location_placeholder')}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('booking.modal.message_label')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={t('booking.modal.message_placeholder')}
                                rows={3}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition resize-none"
                            />
                        </div>
                    </div>

                </form>

                <div className="p-4 border-t border-gray-800 bg-gray-900 z-10">
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.requesterName || !formData.contactInfo || isSubmitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? t('booking.modal.submitting') : t('booking.modal.submit')}
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-2">
                        {t('booking.modal.privacy_note')}
                    </p>
                </div>
            </div>
        </div>
    )
}
