import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Generate a one-time token for socket authentication compatible with better-auth
    // the plugin uses the current session to associate the token
    const token = await auth.api.generateOneTimeToken({
      headers: await headers(),
    })

    return NextResponse.json({ token: token.token })
  } catch (error) {
    console.error('Error generating socket token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
