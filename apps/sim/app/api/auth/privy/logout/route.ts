import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('PrivyLogout')

export async function POST() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('privy-user-id')?.value

    if (privyUserId) {
      logger.info('Clearing Privy authentication cookie', { userId: privyUserId })
    }

    const response = NextResponse.json({ success: true })

    // Clear the privy-user-id cookie
    response.cookies.set('privy-user-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Error clearing Privy cookie:', { error })
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}

