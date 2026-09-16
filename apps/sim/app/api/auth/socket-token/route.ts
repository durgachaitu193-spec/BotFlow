import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Mints a short-lived token the collaborative socket server can verify.
 *
 * This deliberately does NOT use better-auth's one-time tokens. Sign-in goes
 * through Privy, which writes the user row directly (see privy-sync) and never
 * creates a better-auth `session` row — so `auth.api.generateOneTimeToken`
 * always threw here and the socket could never connect. The token is signed
 * with INTERNAL_API_SECRET, which the socket server shares.
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const secretValue = process.env.INTERNAL_API_SECRET
    if (!secretValue) {
      console.error('INTERNAL_API_SECRET is not set; cannot mint a socket token')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const secret = new TextEncoder().encode(secretValue)

    const token = await new SignJWT({ userId: privyUserId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating socket token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
