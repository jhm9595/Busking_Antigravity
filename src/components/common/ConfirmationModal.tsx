import React from 'react'

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100" style={{ background: 'var(--color-popup, var(--color-card))', border: 'var(--popup-border, 1px solid var(--color-border))', boxShadow: 'var(--popup-shadow, 0 25px 50px -12px rgba(0,0,0,0.25))', backdropFilter: 'var(--popup-backdrop-filter, none)' }}>
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
                </div>
                <div className="px-6 py-4 flex justify-end space-x-3" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-lg font-medium hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ 
                            backgroundColor: 'var(--color-card)', 
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 border rounded-lg font-medium hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ 
                            backgroundColor: 'var(--color-primary)', 
                            borderColor: 'var(--color-primary)',
                            color: 'var(--color-primary-foreground)'
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}
