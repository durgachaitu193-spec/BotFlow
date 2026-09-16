'use client'

import { useEffect, useRef, useState } from 'react'
import { useCreateWallet, usePrivy, useWallets } from '@botflow/ui'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
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

/**
 * Transient auth state (signing out, syncing, provisioning a wallet).
 *
 * Styled for the ink backdrop only. These previously used
 * `text-zinc-900 dark:text-white`, which rendered near-black on the dark
 * surface whenever the app was in light theme, so the messages were invisible.
 */
function AuthStatus({ title }: { title: string }) {
  return (
    <div className='text-center'>
      <div className='mb-5 flex items-center justify-center gap-1.5' aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className='auth-flow-node size-2 rounded-full bg-[#ff6a00]'
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <h1
        aria-live='polite'
        className='font-brand text-[26px] font-bold tracking-[-0.02em] text-white'
      >
        {title}
      </h1>
      <p className='mt-2 text-[15px] text-[rgba(242,242,242,0.62)]'>This will only take a moment.</p>
    </div>
  )
}

export default function PrivyLogin() {
  const { ready, authenticated, login, user } = usePrivy()
  const { resolvedTheme } = useTheme()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, refetch } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFromLogout = searchParams.get('fromLogout') === 'true'

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
        credentials: 'include', // Ensure cookies are sent and stored
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

    // If coming from logout, do NOT auto-redirect or sync
    // Instead, we should probably ensure we are logged out
    if (isFromLogout) {
      console.log('Detected fromLogout param, skipping auto-sync')
      return
    }

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
    if (isFromLogout) {
      // If we are still authenticated but came from logout, likely state is not settled
      // We can attempt to logout again or just show a message
      if (ready) {
        // Attempt to ensure logout if we are STUCK here
        /* 
           Note: We avoid an infinite loop by not calling logout() in a loop without checks. 
           But typically we just want to show "Finishing sign out..." and maybe 
           reload after a second if it doesn't clear.
        */
        setTimeout(() => {
          // If we are still here after 2s, force a full reload to clear state
          if (window.location.search.includes('fromLogout')) {
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('fromLogout')
            window.location.href = newUrl.toString()
          }
        }, 2000)
      }

      return <AuthStatus title='Finishing sign out...' />
    }

    if (error) {
      return (
        <div className='text-center'>
          <h1 className='font-brand text-[24px] font-bold tracking-[-0.02em] text-[#ff6a00]'>
            Authentication error
          </h1>
          <p className='mt-3 text-[15px] leading-relaxed text-[rgba(242,242,242,0.62)]'>{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className='mt-6 rounded-full border border-white/15 bg-white/5 px-6 py-5 font-brand text-[15px] font-medium text-white transition-colors hover:border-white/30 hover:bg-white/10'
          >
            Retry connection
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

    return <AuthStatus title={statusMessage} />
  }

  return (
    <div className='w-full'>
      {/* No card: the content floats directly on the ink backdrop, which keeps
          the focus on the mark and the single action. */}
      <div className='w-full'>
        {/* Wordmark only — the node symbol already carries the backdrop, so
            repeating it here would be redundant.
            Sized generously because the asset has heavy transparent padding:
            the glyphs are only ~a third of the PNG's height, so h-20 renders
            letters at roughly 26px. Light variant = white BOT + orange FLOW;
            no brightness/invert filters, they would strip out the orange. */}
        <img
          src='/logo/botflow-text-light.png'
          alt='BotFlow'
          className='h-16 w-auto object-contain object-left md:h-20'
        />

        {/* mt is small on purpose: the wordmark PNG's own transparent padding
            already supplies most of the gap. */}
        <p className='mt-2 font-brand text-[11.5px] font-medium tracking-[0.34em] text-[rgba(242,242,242,0.40)] uppercase'>
          Build <span className='text-[#ff6a00]'>•</span> Deploy{' '}
          <span className='text-[#ff6a00]'>•</span> Connect
        </p>

        <h1 className='mt-3 font-brand text-[30px] leading-[1.12] font-bold tracking-[-0.02em] text-white'>
          A smarter way to
          <br />
          build <span className='text-[#ff6a00]'>what&apos;s next.</span>
        </h1>

        <p className='mt-4 text-[15px] leading-relaxed text-[rgba(242,242,242,0.62)]'>
          Sign in with your social account or connect your wallet to get started.
        </p>

        <Button
          onClick={handleLogin}
          disabled={isLoading || !ready}
          className='auth-button-gradient mt-8 flex w-full items-center justify-center gap-2 rounded-full py-6 font-brand text-[16px] font-medium transition-all duration-200'
        >
          {!ready ? 'Initializing...' : isLoading ? 'Connecting...' : 'Connect Wallet / Sign In'}
        </Button>

        <p className='mt-5 text-center text-[12.5px] text-[rgba(242,242,242,0.40)]'>
          Agents with onchain identity. Payments that settle themselves.
        </p>
      </div>
    </div>
  )
}
