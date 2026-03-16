import React from 'react'

interface DateTimePickerProps {
    label: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    className?: string
}

export default function DateTimePicker({ label, value, onChange, required = false, className = '' }: DateTimePickerProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="datetime-local"
                required={required}
                className="w-full min-w-0 p-2 border rounded text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
