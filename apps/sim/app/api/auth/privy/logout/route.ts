import { createLogger } from '@wazabi/logger'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const logger = createLogger('PrivyLogout')

export async function POST() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (privyUserId) {
      logger.info('Clearing Privy authentication cookie', { userId: privyUserId })
    }

    const response = NextResponse.json({ success: true })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    }

    response.cookies.set('sim-privy-user-id', '', cookieOptions)
    response.cookies.set('privy-user-id', '', cookieOptions) // Clear legacy if exists
    response.cookies.set('privy-token', '', cookieOptions)
    response.cookies.set('privy-refresh-token', '', cookieOptions)
    response.cookies.set('privy-session', '', cookieOptions)

    return response
  } catch (error) {
    logger.error('Error clearing Privy cookie:', { error })
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
