import { NextResponse } from 'next/server'


export async function POST() {
    try {
        const response = NextResponse.json({ success: true })
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 0, // Immediately expire
            path: '/',
        }

        // Clear all related cookies
        response.cookies.set('privy-user-id', '', cookieOptions)
        response.cookies.set('privy-token', '', cookieOptions)
        response.cookies.set('privy-refresh-token', '', cookieOptions)
        response.cookies.set('privy-session', '', cookieOptions)

        return response
    } catch (error) {
        console.error('Error clearing Privy cookie:', error)
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
    }
}
