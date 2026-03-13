import React from 'react'
import styles from './Card.module.css'

interface CardProps {
    variant?: 'default' | 'elevated' | 'outlined' | 'glass'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children: React.ReactNode
    className?: string
    onClick?: () => void
    hoverable?: boolean
}

export default function Card({
    variant = 'default',
    padding = 'md',
    children,
    className = '',
    onClick,
    hoverable = false
}: CardProps) {
    const classes = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        hoverable ? styles.hoverable : '',
        onClick ? styles.clickable : '',
        className
    ].filter(Boolean).join(' ')

    const Component = onClick ? 'button' : 'div'

    return (
        <Component 
            className={classes}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {children}
        </Component>
    )
}

export function CardHeader({ 
    children, 
    className = '' 
}: { 
    children: React.ReactNode
    className?: string 
}) {
    return (
        <div className={`${styles.header} ${className}`}>
            {children}
        </div>
    )
}

export function CardContent({ 
    children, 
    className = '' 
}: { 
    children: React.ReactNode
    className?: string 
}) {
    return (
        <div className={`${styles.content} ${className}`}>
            {children}
        </div>
    )
}

export function CardFooter({ 
    children, 
    className = '' 
}: { 
    children: React.ReactNode
    className?: string 
}) {
    return (
        <div className={`${styles.footer} ${className}`}>
            {children}
        </div>
    )
}
