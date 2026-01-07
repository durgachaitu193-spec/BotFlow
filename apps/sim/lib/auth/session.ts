import { db } from '@sim/db'
import { user } from '@sim/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

/**
 * Get session for Privy-authenticated users
 * Compatible with the previous better-auth getSession API
 */
export async function getSession() {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return null
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
      return null
    }

    return {
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
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
