'use client'

import { useEffect, useRef, useState } from 'react'
import { useCreateWallet, usePrivy, useWallets } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth/auth-client'
import type { PrivyUserData } from '@/lib/privy/types'
import { season } from '@/app/_styles/fonts/season/season'

/**
 * Transform Privy user object to our PrivyUserData structure
 */
const transformPrivyUser = (privyUser: any): PrivyUserData => {
  return {
    privyId: privyUser.id,
    createdAt: privyUser.createdAt,
    updatedAt: privyUser.updatedAt,
    linkedAccounts: privyUser.linkedAccounts?.map((account: any) => ({
      type: account.type,
      address: account.address,
      walletClientType: account.walletClientType,
      verifiedAt: account.verifiedAt,
      createdAt: account.createdAt,
      ...account, // Include any additional properties
    })),
    wallet: privyUser.wallet
      ? {
        address: privyUser.wallet.address,
        walletClientType: privyUser.wallet.walletClientType,
        chainType: privyUser.wallet.chainType,
        createdAt: privyUser.wallet.createdAt,
        ...privyUser.wallet,
      }
      : undefined,
    wallets: privyUser.wallets?.map((wallet: any) => ({
      address: wallet.address,
      walletClientType: wallet.walletClientType,
      chainType: wallet.chainType,
      createdAt: wallet.createdAt,
      ...wallet,
    })),
    metadata: privyUser.metadata || {},
  }
}

export default function PrivyLogin() {
  const { ready, authenticated, login, user } = usePrivy()
  const { resolvedTheme } = useTheme()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const router = useRouter()
  const { data, refetch } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasRedirected = useRef(false)
  const hasSynced = useRef(false)
  const isProcessing = useRef(false)
  const processedUserId = useRef<string | null>(null)
  const lastRedirectAttempt = useRef<number>(0)

  // Get wallet address - simple approach
  const getWalletAddress = (): string | undefined => {
    // Check wallets array first
    if (wallets && wallets.length > 0 && wallets[0]?.address) {
      return wallets[0].address
    }

    // Fall back to user.wallet.address
    if (user?.wallet?.address) {
      return typeof user.wallet.address === 'string'
        ? user.wallet.address
        : (user.wallet.address as any)?.address
    }

    return undefined
  }

  // Sync Privy user data to database
  const syncPrivyUser = async (privyUser: any, walletAddress?: string) => {
    if (hasSynced.current) {
      return
    }

    try {
      setIsSyncing(true)
      hasSynced.current = true

      const privyUserData = transformPrivyUser(privyUser)
      // Use provided wallet address or try to get it
      const finalWalletAddress = walletAddress || getWalletAddress()

      console.log('Syncing Privy user:', {
        privyId: privyUserData.privyId,
        hasWallet: !!finalWalletAddress,
        walletAddress: finalWalletAddress,
      })

      const response = await fetch('/api/auth/privy/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: privyUserData,
          walletAddress: finalWalletAddress,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        console.error('Failed to sync Privy user:', data)
        throw new Error(data?.error || 'Failed to sync user data')
      }

      console.log('Successfully synced Privy user:', data)
      return data
    } catch (error) {
      console.error('Error syncing Privy user:', error)
      hasSynced.current = false // Allow retry
      return null
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle sync + redirect after authentication
  useEffect(() => {
    // Wait for Privy readiness and auth
    if (!ready || !authenticated || !user?.id) return

    const userId = user.id
    const now = Date.now()

    // If we're already processing this exact user, don't start again
    // Unless much time has passed (recovery case)
    if (
      isProcessing.current &&
      processedUserId.current === userId &&
      now - lastRedirectAttempt.current < 10000
    ) {
      return
    }

    // Async function to handle sync and redirect
    const proceedWithSyncAndRedirect = async () => {
      try {
        isProcessing.current = true
        processedUserId.current = userId
        lastRedirectAttempt.current = now

        // 1. Check if we already have a session for this user
        const currentSessionUserId = data?.user?.id || data?.session?.userId

        if (currentSessionUserId === userId) {
          console.log('Session already active for user, redirecting to workspace')
          router.push('/workspace')
          return
        }

        // 2. We don't have a session, so we need to sync
        let walletAddress = getWalletAddress()

        // If no wallet exists, create one explicitly
        if (!walletAddress) {
          try {
            console.log('No wallet found, creating embedded wallet...')
            setIsCreatingWallet(true)
            const wallet = await createWallet()
            if (wallet?.address) {
              walletAddress = wallet.address
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              walletAddress = getWalletAddress()
            }
          } catch (error) {
            console.error('Error creating wallet:', error)
            setError('Failed to create wallet. Proceeding without one.')
          } finally {
            setIsCreatingWallet(false)
          }
        }

        // Sync user data to database
        console.log('Syncing user with wallet:', walletAddress)
        const syncSuccess = await syncPrivyUser(user, walletAddress)

        if (!syncSuccess) {
          console.error('Sync failed')
          setError('Failed to sync account data. Please refresh and try again.')
          return
        }

        // 3. After sync, refetch the session
        console.log('Sync successful, refetching session...')
        await refetch()

        // Wait a bit for the cookie/state to settle
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // 4. Finally redirect
        console.log('Redirecting to workspace')
        router.push('/workspace')
      } catch (err) {
        console.error('Unexpected error in login flow:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        isProcessing.current = false
      }
    }

    proceedWithSyncAndRedirect()
  }, [ready, authenticated, user?.id, wallets, data?.user?.id])

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      login()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authenticated && user) {
    if (error) {
      return (
        <div className='mx-auto max-w-md space-y-4 rounded-2xl border border-red-500/20 bg-black/50 p-6 text-center backdrop-blur-sm'>
          <h1 className={`${season.className} font-medium text-[24px] text-red-500 tracking-tight`}>
            Authentication Error
          </h1>
          <p className={`${season.className} font-[380] text-[16px] text-zinc-600 dark:text-gray-300`}>{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className='mt-4 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
          >
            Retry Connection
          </Button>
        </div>
      )
    }

    const walletAddress = getWalletAddress()
    const statusMessage = isSyncing
      ? 'Syncing account...'
      : isCreatingWallet
        ? 'Creating your wallet...'
        : !walletAddress
          ? 'Setting up wallet...'
          : 'Setting up your account...'

    return (
      <div className='space-y-1 text-center'>
        <h1 className={`${season.className} font-medium text-[32px] text-zinc-900 dark:text-white tracking-tight`}>
          {statusMessage}
        </h1>
        <p className={`${season.className} mt-2 font-[380] text-[16px] text-zinc-500 dark:text-gray-400`}>
          Please wait...
        </p>
      </div>
    )
  }

  return (
    <div
      className='w-full'
    >
      <div className='w-full space-y-8 rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/50 dark:shadow-2xl'>
        <div className='space-y-10 text-center'>
          <div className='flex justify-center'>
            <div className='flex items-center gap-2'>
              <img src={resolvedTheme === 'dark' ? '/logo/wazabi-icon-dark.png' : '/logo/wazabi-icon-light.png'} alt='Wazabi' className='h-8 w-auto rounded-xl' />
              <img
                src={resolvedTheme === 'dark' ? '/logo/wazabi-text-dark.png' : '/logo/wazabi-text-light.png'}
                alt='Wazabi Text'
                className='h-7 w-auto object-contain object-left brightness-0 opacity-90 dark:brightness-0 dark:invert'
              />
            </div>
          </div>

          <p className={`${season.className} font-[380] text-[18px] text-zinc-600 dark:text-gray-300`}>
            Sign in with your social account or connect your wallet to get started.
          </p>
        </div>

        <div className='space-y-6'>
          <Button
            onClick={handleLogin}
            disabled={isLoading || !ready}
            className={`auth-button-gradient flex w-full items-center justify-center gap-2 rounded-[14px] py-6 font-medium text-[17px] transition-all duration-200 ${season.className}`}
          >
            {!ready ? 'Initializing...' : isLoading ? 'Connecting...' : 'Connect Wallet / Sign In'}
          </Button>
        </div>
      </div>
    </div>
  )
}
