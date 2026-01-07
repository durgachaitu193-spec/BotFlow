import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateInternalToken } from '@/lib/auth/internal'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Generate an internal JWT token for socket authentication
    const token = await generateInternalToken(privyUserId)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating socket token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
