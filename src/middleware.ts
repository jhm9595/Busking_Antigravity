import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should be public (no authentication required)
const isPublicRoute = createRouteMatcher([
    '/',
    '/about',
    '/privacy',
    '/terms',
    '/contact',
    '/guides(.*)',
    '/explore(.*)',
    '/singer/([^/]+)',
    '/live/([^/]+)',
    '/api/demo(.*)',
    '/auth/demo(.*)',
])

function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
    // Development mode: add CORS headers for external testing tools
    if (process.env.NODE_ENV === 'development') {
        // Handle preflight OPTIONS requests
        if (request.method === 'OPTIONS') {
            const response = new NextResponse(null, { status: 200 })
            return addCorsHeaders(response)
        }

        // For API routes, add CORS headers to the response
        if (request.nextUrl.pathname.startsWith('/api')) {
            const response = NextResponse.next()
            return addCorsHeaders(response)
        }
    }

    // Skip auth for public routes
    if (isPublicRoute(request)) {
        return NextResponse.next()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
