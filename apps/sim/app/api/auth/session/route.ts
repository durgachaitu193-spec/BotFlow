import { db } from '@wazabi/db'
import { user } from '@wazabi/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return NextResponse.json({ data: null })
    }

    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, privyUserId))
      .limit(1)

    if (!userData) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          emailVerified: userData.emailVerified,
          name: userData.name,
          image: userData.image,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
        session: {
          userId: userData.id,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ data: null })
  }
}
