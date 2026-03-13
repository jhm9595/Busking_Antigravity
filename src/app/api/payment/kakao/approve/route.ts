import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chargePoints } from '@/services/singer'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const pg_token = searchParams.get('pg_token')
        const userId = searchParams.get('userId')
        const pointsStr = searchParams.get('points')
        const orderIdParam = searchParams.get('orderId')
        
        const cookieStore = await cookies()
        const tid = cookieStore.get('kakao_tid')?.value
        const orderIdCookie = cookieStore.get('kakao_order_id')?.value
        // Use the order ID from the ready step (stored in cookie)
        const partnerOrderId = orderIdCookie || orderIdParam

        if (!pg_token || !tid || !userId || !pointsStr || !partnerOrderId) {
            console.error('Missing required parameters for approval:', { pg_token, tid, userId, pointsStr, partnerOrderId })
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=fail&error=missing_params`)
        }

        const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY
        const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'
        const isProduction = process.env.NODE_ENV === 'production'

        // If in mock mode, skip the Kakao Pay server verification (Only in non-production)
        if (!isProduction && (!secretKey || pg_token === 'mock_token_123' || tid?.startsWith('T_MOCK_'))) {
            console.log('Mock payment approval detected. Processing DB update.')
            const result = await chargePoints(userId, parseInt(pointsStr))
            if (result.success) {
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/explore?payment=success&points=${result.points}`)
            }
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/explore?payment=error&error=db_update_failed`)
        }

        if (!secretKey && isProduction) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=error&error=system_misconfigured`)
        }

        const body = {
            cid,
            tid,
            partner_order_id: partnerOrderId,
            partner_user_id: userId,
            pg_token,
        }

        // Determine authorization header based on key prefix
        const authHeader = secretKey!.startsWith('DEV_') || secretKey!.startsWith('TEST_') || secretKey!.startsWith('PROC_')
            ? `SECRET_KEY ${secretKey}`
            : `KakaoAK ${secretKey}`

        const response = await fetch('https://open-api.kakaopay.com/online/v1/payment/approve', {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        if (response.ok) {
            // Update database via server action
            const result = await chargePoints(userId, parseInt(pointsStr))
            
            if (result.success) {
                // Success: Redirect back to the app with success flag
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=success&points=${result.points}`)
            } else {
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=error&error=db_update_failed`)
            }
        } else {
            console.error('Kakao Pay Approve Error:', data)
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=fail&error=${encodeURIComponent(data.msg || 'approval_failed')}`)
        }
    } catch (error) {
        console.error('Payment Approve Server Error:', error)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=error`)
    }
}
