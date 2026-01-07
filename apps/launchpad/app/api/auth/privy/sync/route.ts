import { syncPrivyUser } from '@sim/db/privy-sync'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/privy/sync
 * Sync Privy user data to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const privyUserData = body.user
    const walletAddress = body.walletAddress as string | undefined

    console.log('[AuthSync] Syncing user:', {
      privyId: privyUserData?.privyId,
      walletAddress,
      hasLinkedAccounts: !!privyUserData?.linkedAccounts?.length,
    })

    const result = await syncPrivyUser(privyUserData, walletAddress)

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync user' },
        { status: result.error === 'User with this email already exists' ? 409 : 500 }
      )
    }

    const { user: syncedUser } = result

    const response = NextResponse.json({
      success: true,
      user: syncedUser,
      action: result.action,
    })

    // Set cookie for Privy authentication (expires in 30 days)
    console.log('[AuthSync] Setting launchpad-privy-user-id cookie for user:', syncedUser.id)
    response.cookies.set('launchpad-privy-user-id', syncedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Failed to sync Privy user data', error)
    return NextResponse.json(
      {
        error: 'Failed to sync user data',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
