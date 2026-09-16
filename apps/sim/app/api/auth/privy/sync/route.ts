import { syncPrivyUser } from '@botflow/db/privy-sync'
import { PrivyClient } from '@privy-io/server-auth'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/privy/sync
 *
 * Syncs the authenticated Privy user into our database and issues the
 * `sim-privy-user-id` cookie that getSession() trusts for the rest of the app.
 *
 * SECURITY: this endpoint mints the session cookie, so it must never trust the
 * request body. It previously synced whatever `body.user` was posted and set
 * the cookie from the result, which let anyone POST here and obtain a session
 * for any user. The caller must now present a Privy access token, which is
 * verified with Privy, and the identity in the body must match that token.
 */

let cachedClient: PrivyClient | null = null

function getPrivyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  if (!appId || !appSecret) return null
  if (!cachedClient) cachedClient = new PrivyClient(appId, appSecret)
  return cachedClient
}

function getAccessToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null
  // Privy also keeps the access token in a cookie; accept that as a fallback.
  return request.cookies.get('privy-token')?.value ?? null
}

export async function POST(request: NextRequest) {
  try {
    const privy = getPrivyClient()

    // Fail closed. Without the app secret nothing can be verified, and syncing
    // unverified input is precisely the hole this endpoint used to have.
    if (!privy) {
      console.error(
        '[AuthSync] PRIVY_APP_SECRET or NEXT_PUBLIC_PRIVY_APP_ID is not set; refusing to sync ' +
          'because the caller cannot be verified'
      )
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
    }

    const accessToken = getAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing Privy access token' }, { status: 401 })
    }

    let verifiedPrivyId: string
    try {
      const claims = await privy.verifyAuthToken(accessToken)
      verifiedPrivyId = claims.userId
    } catch (verifyError) {
      console.warn('[AuthSync] Rejected sync: invalid Privy access token', verifyError)
      return NextResponse.json({ error: 'Invalid Privy access token' }, { status: 401 })
    }

    const body = await request.json()
    const privyUserData = body.user
    const walletAddress = body.walletAddress as string | undefined

    if (!privyUserData?.privyId) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 })
    }

    // The body may only ever describe the identity the token proves.
    if (privyUserData.privyId !== verifiedPrivyId) {
      console.warn('[AuthSync] Rejected sync: body identity does not match the verified token', {
        claimed: privyUserData.privyId,
        verified: verifiedPrivyId,
      })
      return NextResponse.json({ error: 'User does not match access token' }, { status: 403 })
    }

    console.log('[AuthSync] Syncing verified user:', {
      privyId: verifiedPrivyId,
      hasWallet: !!walletAddress,
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

    // Session cookie for Privy authentication (expires in 30 days)
    response.cookies.set('sim-privy-user-id', syncedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
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
