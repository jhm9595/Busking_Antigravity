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
            <label className="text-sm font-semibold text-gray-700 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="datetime-local"
                required={required}
                className="w-full min-w-0 p-2 border rounded text-black bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
