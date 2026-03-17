import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Advertisement watch policy constants (from rewarded-ads-guide.md)
const MAX_ADS_PER_HOUR = 3      // 1시간당 최대 광고 시청 횟수
const MIN_COOLDOWN_MINUTES = 10  // 광고 시청 후 최소 대기 시간 (분)
const ADS_PER_DAY_LIMIT = 10     // 1일 최대 광고 시청 횟수
const AD_REWARD_POINTS = 50      // 광고 시청 완료 시 지급 포인트

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Get user's ad watch history using existing PointTransaction table
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        // Count ad rewards in the last hour
        const adsLastHour = await prisma.pointTransaction.count({
            where: {
                profileId: userId,
                type: 'AD_REWARD',
                createdAt: { gt: oneHourAgo }
            }
        })

        // Count ad rewards today
        const adsToday = await prisma.pointTransaction.count({
            where: {
                profileId: userId,
                type: 'AD_REWARD',
                createdAt: { gte: todayStart }
            }
        })

        // Get most recent ad reward for cooldown check
        const mostRecentAd = await prisma.pointTransaction.findFirst({
            where: { profileId: userId, type: 'AD_REWARD' },
            orderBy: { createdAt: 'desc' }
        })

        let minutesSinceLastAd = 0
        if (mostRecentAd) {
            const lastAdTime = new Date(mostRecentAd.createdAt)
            minutesSinceLastAd = Math.floor((Date.now() - lastAdTime.getTime()) / (1000 * 60))
        }

        // Check if user can watch ad
        const canWatch = 
            adsLastHour < MAX_ADS_PER_HOUR &&
            adsToday < ADS_PER_DAY_LIMIT &&
            minutesSinceLastAd >= MIN_COOLDOWN_MINUTES

        return NextResponse.json({
            allowed: canWatch,
            remaining: {
                today: ADS_PER_DAY_LIMIT - adsToday,
                thisHour: MAX_ADS_PER_HOUR - adsLastHour,
                cooldownMinutes: minutesSinceLastAd < MIN_COOLDOWN_MINUTES ? MIN_COOLDOWN_MINUTES - minutesSinceLastAd : 0
            },
            limits: {
                maxPerHour: MAX_ADS_PER_HOUR,
                maxPerDay: ADS_PER_DAY_LIMIT,
                cooldownMinutes: MIN_COOLDOWN_MINUTES,
                rewardPoints: AD_REWARD_POINTS
            },
            watchedToday: adsToday
        })

    } catch (error) {
        console.error('Ad check error:', error)
        // Return allowed on error to not block users
        return NextResponse.json({ 
            allowed: true, 
            reason: 'error',
            message: 'Service temporarily unavailable'
        })
    }
}
