import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { chargePoints } from '@/services/singer'

export async function GET(req: Request) {
    // Get cookies first (outside try for catch block access)
    const cookieStore = await cookies()
    const tid = cookieStore.get('kakao_tid')?.value
    const orderIdCookie = cookieStore.get('kakao_order_id')?.value
    const returnUrlCookie = cookieStore.get('kakao_return_url')?.value
    
    // Default redirect URL or use the stored return URL
    const defaultRedirect = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successRedirect = returnUrlCookie ? `${returnUrlCookie}&payment=success&points=` : `${defaultRedirect}/explore?payment=success&points=`
    const errorRedirect = returnUrlCookie ? `${returnUrlCookie}&payment=error&error=` : `${defaultRedirect}/explore?payment=error&error=`
    const failRedirect = returnUrlCookie ? `${returnUrlCookie}&payment=fail` : `${defaultRedirect}/explore?payment=fail`

    try {
        const { searchParams } = new URL(req.url)
        const pg_token = searchParams.get('pg_token')
        const userId = searchParams.get('userId')
        const pointsStr = searchParams.get('points')
        const orderIdParam = searchParams.get('orderId')
        
        // Use the order ID from the ready step (stored in cookie)
        const partnerOrderId = orderIdCookie || orderIdParam

        if (!pg_token || !tid || !userId || !pointsStr || !partnerOrderId) {
            console.error('Missing required parameters for approval:', { pg_token, tid, userId, pointsStr, partnerOrderId })
            return NextResponse.redirect(failRedirect)
        }

        const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY
        const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME'
        const isProduction = process.env.NODE_ENV === 'production'

        // If in mock mode, skip the Kakao Pay server verification (Only in non-production)
        if (!isProduction && (!secretKey || pg_token === 'mock_token_123' || tid?.startsWith('T_MOCK_'))) {
            console.log('Mock payment approval detected. Processing DB update.')
            const result = await chargePoints(userId, parseInt(pointsStr))
            if (result.success) {
                return NextResponse.redirect(`${successRedirect}${result.points}`)
            }
            return NextResponse.redirect(`${errorRedirect}db_update_failed`)
        }

        if (!secretKey && isProduction) {
            return NextResponse.redirect(`${errorRedirect}system_misconfigured`)
        }

        const body = {
            cid,
            tid,
            partner_order_id: partnerOrderId,
            partner_user_id: userId,
            pg_token,
        }

        // Determine authorization header and URL based on key prefix
        // Consistent with the ready step (New Open API v1 vs Legacy API v1)
        // DEV = development, PRD = production (no underscore)
        const isSecretKeyFormat = secretKey!.startsWith('DEV') || secretKey!.startsWith('PRD') || secretKey!.length > 32
        
        const apiUrl = isSecretKeyFormat
            ? 'https://open-api.kakaopay.com/online/v1/payment/approve'
            : 'https://kapi.kakao.com/v1/payment/approve'
            
        const authHeader = isSecretKeyFormat
            ? `SECRET_KEY ${secretKey}`
            : `KakaoAK ${secretKey}`

        const response = await fetch(apiUrl, {
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
                // Success: Redirect back to the original page with success flag
                return NextResponse.redirect(`${successRedirect}${result.points}`)
            } else {
                return NextResponse.redirect(`${errorRedirect}db_update_failed`)
            }
        } else {
            console.error('Kakao Pay Approve Error:', data)
            const failWithError = returnUrlCookie 
                ? `${returnUrlCookie}&payment=fail&error=${encodeURIComponent(data.msg || 'approval_failed')}`
                : `${failRedirect}&error=${encodeURIComponent(data.msg || 'approval_failed')}`
            return NextResponse.redirect(failWithError)
        }
    } catch (error) {
        console.error('Payment Approve Server Error:', error)
        return NextResponse.redirect(failRedirect)
    }
}
