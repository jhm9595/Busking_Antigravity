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
        const partnerOrderId = orderIdParam || orderIdCookie

        if (!pg_token || !tid || !userId || !pointsStr || !partnerOrderId) {
            console.error('Missing required parameters for approval:', { pg_token, tid, userId, pointsStr, partnerOrderId })
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/explore?payment=fail&error=missing_params`)
        }

        const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY
        const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'

        const body = {
            cid,
            tid,
            partner_order_id: partnerOrderId,
            partner_user_id: userId,
            pg_token,
        }

        const response = await fetch('https://open-api.kakaopay.com/online/v1/payment/approve', {
            method: 'POST',
            headers: {
                Authorization: `SECRET_KEY ${secretKey}`,
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
