import React from 'react'

interface DateTimePickerProps {
    label: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    className?: string
    inputClassName?: string
    labelClassName?: string
}

export default function DateTimePicker({
    label,
    value,
    onChange,
    required = false,
    className = '',
    inputClassName = 'w-full min-w-0 p-2 border rounded text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all',
    labelClassName = 'text-sm font-semibold text-[var(--color-text-secondary)] block'
}: DateTimePickerProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            {label ? (
                <label className={labelClassName}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            ) : null}
            <input
                type="datetime-local"
                required={required}
                className={inputClassName}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
