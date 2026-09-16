import { db } from '@botflow/db'
import { user } from '@botflow/db/schema'
import { createLogger } from '@botflow/logger'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { DEFAULT_CHAIN } from '@/lib/contracts/didRegistry'
import { fetchDIDForAddress } from '@/lib/did/utils'

const logger = createLogger('DIDCheckAPI')

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ hasDID: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wallet address from Privy
    // First check if user has a wallet address stored in the database
    const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)

    if (!userData) {
      return NextResponse.json({ hasDID: false, error: 'User not found' }, { status: 404 })
    }

    // Try to get wallet address from Privy cookie or user metadata
    // For now, we'll need to get it from the client side
    // This is a simplified version - in production, you might want to store wallet address in DB
    const walletAddress = request.nextUrl.searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json({ hasDID: false, error: 'Wallet address required' }, { status: 400 })
    }

    // Check DID status
    const { did, username } = await fetchDIDForAddress(walletAddress, DEFAULT_CHAIN)

    return NextResponse.json({
      hasDID: !!did,
      did: did || null,
      username: username || null,
    })
  } catch (error) {
    logger.error('Error checking DID status:', error)
    return NextResponse.json({ hasDID: false, error: 'Internal server error' }, { status: 500 })
  }
}
