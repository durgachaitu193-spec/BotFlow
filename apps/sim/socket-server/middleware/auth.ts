import { db } from '@sim/db'
import { user } from '@sim/db/schema'
import { createLogger } from '@sim/logger'
import { eq } from 'drizzle-orm'
import type { Socket } from 'socket.io'
import { verifyInternalToken } from '@/lib/auth/internal'

const logger = createLogger('SocketAuth')

// Extend Socket interface to include user data
export interface AuthenticatedSocket extends Socket {
  userId?: string
  userName?: string
  userEmail?: string
  activeOrganizationId?: string
  userImage?: string | null
}

// Enhanced authentication middleware
export async function authenticateSocket(socket: AuthenticatedSocket, next: any) {
  try {
    // Extract authentication data from socket handshake
    const token = socket.handshake.auth?.token
    const origin = socket.handshake.headers.origin
    const referer = socket.handshake.headers.referer

    logger.info(`Socket ${socket.id} authentication attempt:`, {
      hasToken: !!token,
      origin,
      referer,
    })

    if (!token) {
      logger.warn(`Socket ${socket.id} rejected: No authentication token found`)
      return next(new Error('Authentication required'))
    }

    // Validate internal JWT token
    try {
      logger.debug(`Attempting token validation for socket ${socket.id}`, {
        tokenLength: token?.length || 0,
        origin,
      })

      const verification = await verifyInternalToken(token)

      if (!verification.valid || !verification.userId) {
        logger.warn(`Socket ${socket.id} rejected: Invalid token - no user found`)
        return next(new Error('Invalid session'))
      }

      // Fetch user data from database
      const [userData] = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, verification.userId))
        .limit(1)

      if (!userData) {
        logger.warn(`Socket ${socket.id} rejected: User not found in database`)
        return next(new Error('User not found'))
      }

      // Store user info in socket for later use
      socket.userId = userData.id
      socket.userName = userData.name || userData.email || 'Unknown User'
      socket.userEmail = userData.email
      socket.userImage = userData.image || null

      logger.debug(`Socket ${socket.id} authenticated successfully`, {
        userId: socket.userId,
      })

      next()
    } catch (tokenError) {
      const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError)
      const errorStack = tokenError instanceof Error ? tokenError.stack : undefined

      logger.warn(`Token validation failed for socket ${socket.id}:`, {
        error: errorMessage,
        stack: errorStack,
        origin,
        referer,
      })
      const clientMsg =
        process.env.NODE_ENV === 'development'
          ? `Token validation failed: ${errorMessage}`
          : 'Token validation failed'
      return next(new Error(clientMsg))
    }
  } catch (error) {
    logger.error(`Socket authentication error for ${socket.id}:`, error)
    next(new Error('Authentication failed'))
  }
}
