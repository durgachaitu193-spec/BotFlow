'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { PrivyUserData } from '@/lib/privy/types'
import { inter } from '@/app/_styles/fonts/inter/inter'
import { soehne } from '@/app/_styles/fonts/soehne/soehne'
import { useSession } from '@/lib/auth/auth-client'

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
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const router = useRouter()
  const { refetch } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasRedirected = useRef(false)
  const hasSynced = useRef(false)
  const isProcessing = useRef(false)
  const processedUserId = useRef<string | null>(null)

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
    // Prevent multiple redirects - check if we've already processed this user
    if (hasRedirected.current || isProcessing.current) return
    if (processedUserId.current === user?.id) return

    // Wait for Privy readiness and auth
    if (!ready) return
    if (!authenticated || !user?.id) return

    // Mark as processing immediately to prevent re-execution
    isProcessing.current = true
    hasRedirected.current = true
    processedUserId.current = user.id

    // Async function to handle sync and redirect
    const proceedWithSyncAndRedirect = async () => {
      // Check if user has a wallet
      let walletAddress = getWalletAddress()

      // If no wallet exists, create one explicitly
      if (!walletAddress) {
        try {
          console.log('No wallet found, creating embedded wallet...')
          setIsCreatingWallet(true)

          // Use createWallet function to explicitly create a wallet
          const wallet = await createWallet()

          if (wallet?.address) {
            walletAddress = wallet.address
            console.log('Wallet created successfully:', walletAddress)
          } else {
            // Wait a bit for wallet to be available in wallets array
            await new Promise((resolve) => setTimeout(resolve, 1000))
            walletAddress = getWalletAddress()
          }
        } catch (error) {
          console.error('Error creating wallet:', error)
          // Continue without wallet - user can still be synced
          setError('Failed to create wallet. Please try again.')
          isProcessing.current = false
          hasRedirected.current = false
          hasSynced.current = false
          processedUserId.current = null
          setIsCreatingWallet(false)
          return
        } finally {
          setIsCreatingWallet(false)
        }
      }

      // If still no wallet after creation attempt, wait a bit more
      if (!walletAddress) {
        console.log('Waiting for wallet to be available...')
        let attempts = 0
        const maxAttempts = 10 // Wait up to 5 seconds (10 * 500ms)

        while (!walletAddress && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          walletAddress = getWalletAddress()
          attempts++
        }

        if (!walletAddress && attempts >= maxAttempts) {
          console.warn('Wallet not available after creation attempt, proceeding without wallet address')
        }
      }

      // Sync user data to database (with wallet address)
      const syncResult = await syncPrivyUser(user, walletAddress)

      if (!syncResult) {
        console.error('Sync failed, cannot redirect')
        // Reset processing flags so user can retry
        isProcessing.current = false
        hasRedirected.current = false
        hasSynced.current = false
        processedUserId.current = null
        setError('Failed to sync account data. Please try again.')
        return
      }
      console.log('Sync successful, refetching session...')
      await refetch()
      router.push('/workspace')
    }
    proceedWithSyncAndRedirect()
  }, [ready, authenticated, user?.id, wallets])

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
        <div className='space-y-4 text-center max-w-md mx-auto p-6 bg-black/20 rounded-2xl border border-red-500/20 backdrop-blur-sm'>
          <h1 className={`${soehne.className} font-medium text-[24px] text-red-400 tracking-tight`}>
            Authentication Error
          </h1>
          <p className={`${inter.className} font-[380] text-[16px] text-gray-200`}>{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className='mt-4 bg-white/10 hover:bg-white/20 text-white border border-white/10'
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
        <h1 className={`${soehne.className} font-medium text-[32px] text-white tracking-tight`}>
          {statusMessage}
        </h1>
        <p className={`${inter.className} font-[380] text-[16px] text-gray-200 mt-2`}>
          Please wait...
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className='relative flex min-h-screen items-center justify-center px-4 m'
    >
      <div
        className='
      w-full max-w-md
      rounded-3xl
      bg-black/10
      backdrop-blur-2xl
      border border-black/20
      shadow-2xl
      p-8   
      space-y-8         
    '
      >
        <div className='space-y-10 text-center'>
          <div className='flex justify-center'>
            <Image
              src='/logo/lockup_ow.png'
              alt='Megalith Logo'
              width={240}
              height={80}
              className='h-6 w-auto object-contain'
              priority
            />
          </div>

          <p className={`${inter.className} font-[380] text-[18px] text-gray-200`}>
            Sign in with your social account or connect your wallet to get started.
          </p>
        </div>

        <div className='space-y-6'>
          <Button
            onClick={handleLogin}
            disabled={isLoading || !ready}
            className='
          auth-button-gradient
          flex w-full items-center justify-center gap-2
          rounded-[12px]
          font-medium text-[17px]
          text-white
          py-4 
          transition-all duration-200
        '
          >
            {!ready ? 'Initializing...' : isLoading ? 'Connecting...' : 'Connect Wallet / Sign In'}
          </Button>

          {/* <p className={`${inter.className} text-center font-light text-[15px] text-gray-200`}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p> */}
        </div>
      </div>
    </motion.div>
  )
}

