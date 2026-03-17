import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Advertisement watch policy constants (must match /api/ad/check)
const MAX_ADS_PER_HOUR = 3
const MIN_COOLDOWN_MINUTES = 10
const ADS_PER_DAY_LIMIT = 10
const AD_REWARD_POINTS = 50

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, status = 'completed' } = body

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // First check if user is eligible to watch ad
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        // Count ads in last hour and today
        const [adsLastHour, adsToday, mostRecentAd] = await Promise.all([
            prisma.pointTransaction.count({
                where: { profileId: userId, type: 'AD_REWARD', createdAt: { gt: oneHourAgo } }
            }),
            prisma.pointTransaction.count({
                where: { profileId: userId, type: 'AD_REWARD', createdAt: { gte: todayStart } }
            }),
            prisma.pointTransaction.findFirst({
                where: { profileId: userId, type: 'AD_REWARD' },
                orderBy: { createdAt: 'desc' }
            })
        ])

        // Calculate cooldown
        let minutesSinceLastAd = 0
        if (mostRecentAd) {
            const lastAdTime = new Date(mostRecentAd.createdAt)
            minutesSinceLastAd = Math.floor((Date.now() - lastAdTime.getTime()) / (1000 * 60))
        }

        // Validate eligibility
        const canWatch = 
            adsLastHour < MAX_ADS_PER_HOUR &&
            adsToday < ADS_PER_DAY_LIMIT &&
            minutesSinceLastAd >= MIN_COOLDOWN_MINUTES

        if (!canWatch) {
            return NextResponse.json({ 
                success: false, 
                error: 'AD_QUOTA_EXCEEDED',
                message: '광고 시청 횟수 또는 쿨타임 제한을 초과했습니다.',
                remaining: {
                    today: ADS_PER_DAY_LIMIT - adsToday,
                    thisHour: MAX_ADS_PER_HOUR - adsLastHour,
                    cooldownMinutes: minutesSinceLastAd < MIN_COOLDOWN_MINUTES ? MIN_COOLDOWN_MINUTES - minutesSinceLastAd : 0
                }
            }, { status: 403 })
        }

        // If status is completed, award points
        if (status === 'completed') {
            // Award points to user
            const profile = await prisma.profile.update({
                where: { id: userId },
                data: { points: { increment: AD_REWARD_POINTS } }
            })

            // Record transaction
            await prisma.pointTransaction.create({
                data: {
                    profileId: userId,
                    amount: AD_REWARD_POINTS,
                    type: 'AD_REWARD',
                    description: `광고 시청 보상 (+${AD_REWARD_POINTS}P)`
                }
            })

            return NextResponse.json({
                success: true,
                points: profile.points,
                rewardPoints: AD_REWARD_POINTS,
                message: `${AD_REWARD_POINTS}포인트가 지급되었습니다!`
            })
        } else {
            // User skipped or failed - no points awarded
            return NextResponse.json({
                success: false,
                error: 'AD_SKIPPED',
                message: '광고를 완료하지 않아 포인트가 지급되지 않습니다.'
            })
        }

    } catch (error) {
        console.error('Ad complete error:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'INTERNAL_ERROR',
            message: '포인트 지급 중 오류가 발생했습니다.' 
        }, { status: 500 })
    }
}
