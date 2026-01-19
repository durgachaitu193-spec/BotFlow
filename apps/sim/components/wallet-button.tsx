'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createLogger } from '@wazabi/logger'
import { Check, Copy, LogOut, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clearUserData } from '@/stores'

const logger = createLogger('WalletButton')

export function WalletButton() {
  const router = useRouter()
  const { ready, authenticated, logout: privyLogout, user } = usePrivy()
  const { wallets } = useWallets()
  const [isCopied, setIsCopied] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Get wallet address from wallets or user - EXACTLY like privy-wallet-app
  useEffect(() => {
    const embeddedWallet = wallets?.find((w) => (w as any).walletClientType === 'privy')

    if (embeddedWallet?.address) {
      setWalletAddress(embeddedWallet.address)
    } else if (wallets && wallets.length > 0 && wallets[0]?.address) {
      setWalletAddress(wallets[0].address)
    } else if (user?.wallet?.address) {
      const address =
        typeof user.wallet.address === 'string'
          ? user.wallet.address
          : (user.wallet.address as any)?.address || null
      setWalletAddress(address)
    } else {
      setWalletAddress(null)
    }
  }, [wallets, user])

  const handleCopyAddress = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      logger.error('Error copying wallet address:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      // If Privy is authenticated, logout from Privy and clear the cookie
      if (authenticated) {
        try {
          // Clear the privy-user-id cookie via API
          await fetch('/api/auth/privy/logout', {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {
            document.cookie = 'sim-privy-user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            document.cookie = 'privy-user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          })

          // Logout from Privy
          await privyLogout()
        } catch (privyError) {
          logger.error('Error during Privy logout:', { error: privyError })
        }

        // Clear user data
        await clearUserData()
      }

      router.push('/login?fromLogout=true')
    } catch (error) {
      logger.error('Error disconnecting wallet:', { error })
      router.push('/login?fromLogout=true')
    }
  }

  // Don't show if not ready or not authenticated
  if (!ready || !authenticated) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='h-[32px] w-[32px] rounded-[11px] border bg-card text-card-foreground shadow-xs hover:border-[var(--brand-primary-hex)] hover:bg-[var(--brand-primary-hex)] hover:text-white'
        >
          <Wallet className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72 max-w-[calc(100vw-2rem)]'>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='font-medium text-sm leading-none'>Wallet</p>
            {walletAddress && (
              <p className='break-all font-mono text-muted-foreground text-xs leading-tight'>
                {walletAddress}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {walletAddress && (
          <>
            <DropdownMenuItem onClick={handleCopyAddress}>
              {isCopied ? (
                <>
                  <Check className='mr-2 h-4 w-4 text-green-500' />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className='mr-2 h-4 w-4' />
                  <span>Copy address</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleDisconnect} className='text-destructive'>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Sign Out/Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
