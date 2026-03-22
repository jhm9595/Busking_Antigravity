import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buildPaymentReturnUrl } from '@/lib/kakaoRedirect'

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const returnUrlCookie = cookieStore.get('kakao_return_url')?.value
  const defaultRedirect = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fallbackRedirect = `${defaultRedirect}/explore`
  const { searchParams } = new URL(req.url)
  const payment = searchParams.get('payment') || 'fail'
  const error = searchParams.get('error') || undefined

  return NextResponse.redirect(
    buildPaymentReturnUrl(defaultRedirect, returnUrlCookie || fallbackRedirect, {
      payment,
      error,
    })
  )
}
