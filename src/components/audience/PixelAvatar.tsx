'use client'
import React from 'react'

export interface AvatarConfig {
    skinColor: string
    hairStyle: number
    hairColor: string
    hatStyle: number
    hatColor: string
    faceExpression: number
    topStyle: number
    topColor: string
    bottomStyle: number
    bottomColor: string
}

interface PixelAvatarProps {
    config: AvatarConfig
    size?: number
    className?: string
}

export default function PixelAvatar({ config, size = 64, className = '' }: PixelAvatarProps) {
    if (!config) return null

    // Simple pixel construction using SVG rects on a 8x8 grid or 16x16 grid.
    // Let's use 16x16 as standard for "pixel art".

    // Skin Colors map
    const skinColors = ['#f8d9ce', '#f0c0a8', '#e0ac69', '#8d5524', '#c68642']

    // Layer Helpers
    const rect = (x: number, y: number, w: number, h: number, fill: string) => (
        <rect key={`r-${x}-${y}-${w}-${h}-${fill.replace('#', '')}`} x={x} y={y} width={w} height={h} fill={fill} />
    )

    const renderHead = () => {
        // Simple 10x10 head centered at (3,2)
        return rect(5, 3, 6, 6, config.skinColor)
    }

    const renderHair = () => {
        const c = config.hairColor
        switch (config.hairStyle) {
            case 0: return null // Bald
            case 1: // Short
                return (
                    <>
                        {rect(5, 2, 6, 2, c)}
                        {rect(4, 3, 1, 2, c)}
                        {rect(11, 3, 1, 2, c)}
                    </>
                )
            case 2: // Long
                return (
                    <>
                        {rect(5, 2, 6, 2, c)}
                        {rect(4, 3, 1, 6, c)}
                        {rect(11, 3, 1, 6, c)}
                    </>
                )
            case 3: // Spiky
                return (
                    <>
                        {rect(6, 1, 1, 1, c)}
                        {rect(8, 1, 1, 1, c)}
                        {rect(5, 2, 6, 2, c)}
                    </>
                )
            default: return rect(5, 2, 6, 2, c)
        }
    }

    const renderFace = () => {
        // Eyes at (6, 5) and (9, 5)
        // Mouth at (6, 7)-(9, 7)
        const eyeColor = '#000'
        const eyes = (
            <>
                {rect(6, 5, 1, 1, eyeColor)}
                {rect(9, 5, 1, 1, eyeColor)}
            </>
        )

        let mouth = rect(6, 7, 4, 1, '#a03030') // Neutral
        if (config.faceExpression === 1) { // Smile
            mouth = (
                <>
                    {rect(6, 7, 1, 1, '#a03030')}
                    {rect(9, 7, 1, 1, '#a03030')}
                    {rect(7, 8, 2, 1, '#a03030')}
                </>
            )
        } else if (config.faceExpression === 2) { // O
            mouth = rect(7, 7, 2, 2, '#a03030')
        }

        return (
            <>
                {eyes}
                {mouth}
            </>
        )
    }

    const renderHat = () => {
        if (config.hatStyle === 0) return null
        const c = config.hatColor
        // Cap
        if (config.hatStyle === 1) {
            return (
                <>
                    {rect(4, 1, 8, 2, c)}
                    {rect(4, 3, 9, 1, c)}
                </>
            )
        }
        // Beanie
        if (config.hatStyle === 2) {
            return (
                <>
                    {rect(5, 1, 6, 2, c)}
                    {rect(4, 2, 8, 2, c)}
                </>
            )
        }
        return null
    }

    const renderBody = () => {
        const topC = config.topColor
        const botC = config.bottomColor

        // --- Top Styles ---
        let top;
        let arms;

        // 0: T-Shirt (Short Sleeve)
        if (config.topStyle === 0) {
            top = rect(4, 9, 8, 4, topC)
            arms = (
                <>
                    {rect(3, 9, 1, 2, topC)} {/* Sleeve L */}
                    {rect(12, 9, 1, 2, topC)} {/* Sleeve R */}
                    {rect(3, 11, 1, 2, config.skinColor)} {/* Arm L */}
                    {rect(12, 11, 1, 2, config.skinColor)} {/* Arm R */}
                </>
            )
        }
        // 1: Long Sleeve
        else if (config.topStyle === 1) {
            top = rect(4, 9, 8, 4, topC)
            arms = (
                <>
                    {rect(3, 9, 1, 4, topC)} {/* Sleeve L */}
                    {rect(12, 9, 1, 4, topC)} {/* Sleeve R */}
                </>
            )
        }
        // 2: Tank Top / Sleeveless
        else {
            top = (
                <>
                    {rect(4, 9, 8, 4, topC)}
                    {/* Straps/Shoulders cut out roughly handled by main block, refine: */}
                    {rect(4, 9, 1, 1, config.skinColor)}
                    {rect(11, 9, 1, 1, config.skinColor)}
                </>
            )
            arms = (
                <>
                    {rect(3, 9, 1, 4, config.skinColor)}
                    {rect(12, 9, 1, 4, config.skinColor)}
                </>
            )
        }

        // --- Bottom Styles ---
        let bottom;

        // 0: Pants (Long)
        if (config.bottomStyle === 0) {
            bottom = (
                <>
                    {rect(5, 13, 2, 3, botC)}
                    {rect(9, 13, 2, 3, botC)}
                    {/* Crotch fill usually needed for pants? keep simple */}
                </>
            )
        }
        // 1: Shorts
        else if (config.bottomStyle === 1) {
            bottom = (
                <>
                    {rect(5, 13, 2, 1, botC)}
                    {rect(9, 13, 2, 1, botC)}
                    {rect(5, 14, 2, 2, config.skinColor)} {/* Legs */}
                    {rect(9, 14, 2, 2, config.skinColor)} {/* Legs */}
                </>
            )
        }
        // 2: Skirt / Dress
        else {
            bottom = (
                <>
                    {rect(4, 13, 8, 2, botC)} {/* Skirt body */}
                    {rect(5, 15, 2, 1, config.skinColor)} {/* Legs visible? or long skirt */}
                    {rect(9, 15, 2, 1, config.skinColor)}
                </>
            )
        }

        // Shoes
        const shoes = (
            <>
                {rect(4, 15, 3, 1, '#333')}
                {rect(9, 15, 3, 1, '#333')}
            </>
        )

        return (
            <>
                {top}
                {arms}
                {bottom}
                {shoes}
            </>
        )
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
            className={`pixel-avatar ${className}`}
            style={{ shapeRendering: 'crispEdges' }}
        >
            {renderBody()}
            {renderHead()}
            {renderFace()}
            {renderHair()}
            {renderHat()}
        </svg>
    )
}
