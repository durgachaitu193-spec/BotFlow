import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { BSC_MAINNET, BSC_TESTNET } from '@/lib/contracts/didRegistry'
import { checkUsernameAvailability } from '@/lib/did/utils'
import { createLogger } from '@/lib/logs/console/logger'

const logger = createLogger('UsernameCheckAPI')

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ available: false, error: 'Unauthorized' }, { status: 401 })
    }

    const username = request.nextUrl.searchParams.get('username')
    const chainParam = request.nextUrl.searchParams.get('chain') || 'testnet'

    if (!username || !username.trim()) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 })
    }

    // Select chain based on parameter
    const chain = chainParam === 'mainnet' ? BSC_MAINNET : BSC_TESTNET

    logger.info('Checking username availability', {
      username: username.trim(),
      chain: chain.name,
    })

    try {
      const available = await checkUsernameAvailability(username.trim(), chain)

      return NextResponse.json({
        available,
        username: username.trim(),
        chain: chain.name,
      })
    } catch (error: any) {
      logger.error('Error checking username availability:', {
        error: error?.message || error,
        username: username.trim(),
        chain: chain.name,
      })

      return NextResponse.json(
        {
          available: false,
          error: 'Failed to check username availability',
          details: error?.message || 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Unexpected error in username check API:', error)
    return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 })
  }
}
