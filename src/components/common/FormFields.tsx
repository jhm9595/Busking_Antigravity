'use client'

import React from 'react'

type BaseFieldProps = {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}

function fieldStyles() {
  return {
    label: {
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: 'var(--color-text-muted)',
      display: 'block',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      padding: '0.75rem 1rem',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      outline: 'none',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem',
      height: '3rem',
      boxSizing: 'border-box' as const,
      appearance: 'none' as const,
      WebkitAppearance: 'none' as const,
      lineHeight: 1.2,
    },
    textarea: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      padding: '0.75rem 1rem',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      outline: 'none',
      transition: 'all 0.2s ease',
      fontSize: '0.95rem',
      boxSizing: 'border-box' as const,
      resize: 'none' as const,
      minHeight: '7rem',
    },
    helpText: {
      fontSize: '0.75rem',
      color: 'var(--color-text-muted)',
      marginTop: '0.25rem',
    },
  }
}

export function RequiredMark() {
  return <span className="text-red-500">*</span>
}

export function FormField({ label, required = false, hint, children }: BaseFieldProps) {
  const styles = fieldStyles()
  const hasLabel = Boolean(label)

  return (
    <div>
      {hasLabel ? (
        <label style={styles.label}>
          {label} {required ? <RequiredMark /> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p style={styles.helpText}>{hint}</p> : null}
    </div>
  )
}

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
}

export function TextInputField({ label, required = false, hint, style, ...props }: InputFieldProps) {
  const styles = fieldStyles()

  return (
    <FormField label={label} required={required} hint={hint}>
      <input {...props} required={required} style={{ ...styles.input, ...style }} />
    </FormField>
  )
}

export function DateInputField({ label, required = false, hint, style, ...props }: InputFieldProps) {
  const styles = fieldStyles()

  return (
    <FormField label={label} required={required} hint={hint}>
      <input {...props} required={required} type="date" style={{ ...styles.input, ...style }} />
    </FormField>
  )
}

type DateTimeInputFieldProps = Omit<InputFieldProps, 'onChange'> & {
  onChange?: (value: string) => void
}

export function DateTimeInputField({ label, required = false, hint, style, onChange, ...props }: DateTimeInputFieldProps) {
  const styles = fieldStyles()

  return (
    <FormField label={label} required={required} hint={hint}>
      <input
        {...props}
        required={required}
        type="datetime-local"
        style={{ ...styles.input, ...style }}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </FormField>
  )
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}

export function SelectField({ label, required = false, hint, style, children, ...props }: SelectFieldProps) {
  const styles = fieldStyles()

  return (
    <FormField label={label} required={required} hint={hint}>
      <select {...props} required={required} style={{ ...styles.input, ...style }}>
        {children}
      </select>
    </FormField>
  )
}

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
}

export function TextareaField({ label, required = false, hint, style, ...props }: TextareaFieldProps) {
  const styles = fieldStyles()

  return (
    <FormField label={label} required={required} hint={hint}>
      <textarea {...props} required={required} style={{ ...styles.textarea, ...style }} />
    </FormField>
  )
}
