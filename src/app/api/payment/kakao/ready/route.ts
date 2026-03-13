import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { userId, points, amount, packageName } = await req.json()
        
        // Kakao Pay Secret Key and CID from environment variables (Open API version)
        // Variable names updated to match new Kakao Pay Developer center terminology
        const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY
        const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME' 
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Disable Mock mode in production regardless of key presence
        const isProduction = process.env.NODE_ENV === 'production'

        if (!secretKey) {
            if (isProduction) {
                console.error('CRITICAL: KAKAO_PAY_SECRET_KEY missing in production!')
                return NextResponse.json({ error: 'Payment system unavailable' }, { status: 500 })
            }

            console.warn('KAKAO_PAY_SECRET_KEY missing. Entering MOCK payment mode for testing.')
            const mockOrderId = `mock_${Date.now()}`
            const res = NextResponse.json({ 
                next_redirect_pc_url: `${appUrl}/api/payment/kakao/approve?userId=${userId}&points=${points}&orderId=${mockOrderId}&pg_token=mock_token_123`,
                next_redirect_mobile_url: `${appUrl}/api/payment/kakao/approve?userId=${userId}&points=${points}&orderId=${mockOrderId}&pg_token=mock_token_123`,
                tid: `T_MOCK_${Date.now()}`
            })
            
            res.cookies.set('kakao_tid', `T_MOCK_${Date.now()}`, { httpOnly: true, maxAge: 600 })
            res.cookies.set('kakao_order_id', mockOrderId, { httpOnly: true, maxAge: 600 })
            
            return res
        }

        // Generate a unique order ID to be shared across steps
        const partnerOrderId = `BK_${Date.now()}_${userId.slice(-4)}`

        const body = {
            cid,
            partner_order_id: partnerOrderId,
            partner_user_id: userId.slice(0, 100), // Kakao limitation: max 100 chars
            item_name: `${packageName} (${points}P)`.slice(0, 100),
            quantity: 1,
            total_amount: Math.floor(Number(amount)),
            tax_free_amount: 0,
            approval_url: `${appUrl}/api/payment/kakao/approve?userId=${userId}&points=${points}&orderId=${partnerOrderId}`,
            cancel_url: `${appUrl}/explore?payment=cancel`,
            fail_url: `${appUrl}/explore?payment=fail`,
        }

        // Determine authorization header and URL based on key prefix
        // New Open API (v1) requires SECRET_KEY prefix and JSON
        // Legacy API (v1) requires KakaoAK prefix and URL-encoded (but often accepts JSON too)
        const isSecretKeyFormat = secretKey.startsWith('DEV_') || secretKey.startsWith('TEST_') || secretKey.startsWith('PROC_') || secretKey.length > 32
        
        const apiUrl = isSecretKeyFormat
            ? 'https://open-api.kakaopay.com/online/v1/payment/ready'
            : 'https://kapi.kakao.com/v1/payment/ready'
            
        const authHeader = isSecretKeyFormat
            ? `SECRET_KEY ${secretKey}`
            : `KakaoAK ${secretKey}`

        console.log('Sending Kakao Pay Ready Request:', { 
            url: apiUrl,
            cid: body.cid,
            partner_order_id: body.partner_order_id,
            total_amount: body.total_amount,
            auth_type: authHeader.split(' ')[0],
            isSecretKeyFormat,
            keyFirst4: secretKey.slice(0, 4),
            appUrl
        })

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
            const res = NextResponse.json({ 
                next_redirect_pc_url: data.next_redirect_pc_url,
                next_redirect_mobile_url: data.next_redirect_mobile_url,
                tid: data.tid 
            })
            
            // Set TID and Order ID cookies for approval step (security & matching)
            res.cookies.set('kakao_tid', data.tid, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                maxAge: 600 // 10 minutes
            })
            res.cookies.set('kakao_order_id', partnerOrderId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 600
            })
            
            return res
        } else {
            console.error('Kakao Pay Ready Error:', JSON.stringify(data))
            return NextResponse.json({ 
                error: data.msg || 'Kakao Pay preparation failed', 
                details: data, // Forward Kakao error details for debugging
                code: data.code
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Payment Ready Server Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
