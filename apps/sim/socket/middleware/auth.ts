import { db } from '@botflow/db'
import { user } from '@botflow/db/schema'
import { createLogger } from '@botflow/logger'
import { eq } from 'drizzle-orm'
import { jwtVerify } from 'jose'
import type { Socket } from 'socket.io'
import { ANONYMOUS_USER, ANONYMOUS_USER_ID } from '@/lib/auth'
import { isAuthDisabled } from '@/lib/core/config/feature-flags'

const logger = createLogger('SocketAuth')

/**
 * Authenticated socket with user data attached.
 */
export interface AuthenticatedSocket extends Socket {
  userId?: string
  userName?: string
  userEmail?: string
  activeOrganizationId?: string
  userImage?: string | null
}

/**
 * Socket.IO authentication middleware.
 * Handles both anonymous mode (DISABLE_AUTH=true) and normal token-based auth.
 */
export async function authenticateSocket(socket: AuthenticatedSocket, next: any) {
  try {
    if (isAuthDisabled) {
      socket.userId = ANONYMOUS_USER_ID
      socket.userName = ANONYMOUS_USER.name
      socket.userEmail = ANONYMOUS_USER.email
      socket.userImage = ANONYMOUS_USER.image
      logger.debug(`Socket ${socket.id} authenticated as anonymous`)
      return next()
    }

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

    // Validate the JWT minted by /api/auth/socket-token.
    //
    // Not better-auth's verifyOneTimeToken: sign-in goes through Privy, which
    // never creates a better-auth `session` row, so issuing one of those tokens
    // was impossible and the handshake could never happen.
    try {
      logger.debug(`Attempting token validation for socket ${socket.id}`, {
        tokenLength: token?.length || 0,
        origin,
      })

      const secretValue = process.env.INTERNAL_API_SECRET
      if (!secretValue) {
        logger.error('INTERNAL_API_SECRET is not set; cannot verify socket tokens')
        return next(new Error('Server misconfigured'))
      }

      const { payload } = await jwtVerify(token, new TextEncoder().encode(secretValue))

      if (!payload.userId || typeof payload.userId !== 'string') {
        logger.warn(`Socket ${socket.id} rejected: token carries no user id`)
        return next(new Error('Invalid session'))
      }

      const [userData] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, payload.userId))
        .limit(1)

      if (!userData) {
        logger.warn(`Socket ${socket.id} rejected: user ${payload.userId} not found`)
        return next(new Error('Invalid session'))
      }

      socket.userId = userData.id
      socket.userName = userData.name || userData.email || 'Unknown User'
      socket.userEmail = userData.email || ''
      socket.userImage = userData.image || null
      // activeOrganizationId comes from a better-auth session, which this flow
      // does not have; org-scoped features fall back to undefined.
      socket.activeOrganizationId = undefined

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
      return next(new Error('Token validation failed'))
    }
  } catch (error) {
    logger.error(`Socket authentication error for ${socket.id}:`, error)
    next(new Error('Authentication failed'))
  }
}
