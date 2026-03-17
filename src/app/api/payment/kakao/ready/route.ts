import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { userId, points, amount, packageName } = await req.json()
        
        // Kakao Pay Secret Key and CID from environment variables (Open API version)
        // Variable names updated to match new Kakao Pay Developer center terminology
        const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY
        const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME' 
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Check environment - detailed debugging
        const isProd = process.env.NODE_ENV === 'production'
        console.log('[KakaoPay] Environment check:', {
            hasSecretKey: !!secretKey,
            hasCID: !!process.env.KAKAO_PAY_CID,
            cidValue: cid,
            isProduction: isProd,
            nodeEnv: process.env.NODE_ENV
        })

        // Allow mock mode in development/staging, but NOT in production
        if (!secretKey) {
            if (isProd) {
                console.error('CRITICAL: KAKAO_PAY_SECRET_KEY missing in production!')
                return NextResponse.json({ 
                    error: 'Payment system configuration error',
                    message: 'KAKAO_PAY_SECRET_KEY is not configured. Please set it in Vercel environment variables.',
                    hint: 'Go to Vercel Dashboard > Settings > Environment Variables'
                }, { status: 500 })
            }

            console.warn('KAKAO_PAY_SECRET_KEY missing. Entering MOCK payment mode for testing.')
            const mockOrderId = `mock_${Date.now()}`
            const res = NextResponse.json({ 
                next_redirect_pc_url: `${appUrl}/api/payment/kakao/approve?userId=${userId}&points=${points}&orderId=${mockOrderId}&pg_token=mock_token_123`,
                next_redirect_mobile_url: `${appUrl}/api/payment/kakao/approve?userId=${userId}&points=${points}&orderId=${mockOrderId}&pg_token=mock_token_123`,
                tid: `T_MOCK_${Date.now()}`,
                _mock: true
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
        // DEV = development, PRD = production (no underscore)
        const isSecretKeyFormat = secretKey.startsWith('DEV') || secretKey.startsWith('PRD') || secretKey.length > 32
        
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
            
            // Provide more helpful error messages based on common issues
            let errorMessage = data.msg || 'Kakao Pay preparation failed'
            let hint = ''
            
            if (data.code === -801) {
                hint = 'CID may be invalid. For testing, use TC0ONETIME'
            } else if (data.code === -802) {
                hint = 'Invalid payment method or approval URL'
            } else if (data.code === -803) {
                hint = 'Payment request limit exceeded or invalid parameters'
            } else if (response.status === 401) {
                hint = 'Invalid secret key. Check KAKAO_PAY_SECRET_KEY in Vercel'
            } else if (response.status === 403) {
                hint = 'Secret key does not have permission. Generate a new key in Kakao Pay developer center'
            }
            
            return NextResponse.json({ 
                error: errorMessage, 
                details: data,
                code: data.code,
                hint: hint,
                debug: {
                    cid,
                    apiUrl: isSecretKeyFormat ? 'open-api.kakaopay.com' : 'kapi.kakao.com',
                    authType: authHeader.split(' ')[0]
                }
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Payment Ready Server Error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
