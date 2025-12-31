'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Check, Copy, LogOut, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export interface WalletButtonProps {
  onSignOut?: () => Promise<void> | void
}

export function WalletButton({ onSignOut }: WalletButtonProps) {
  const router = useRouter()
  const { ready, authenticated, logout: privyLogout, user, login } = usePrivy()
  const { wallets } = useWallets()
  const [isCopied, setIsCopied] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

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
      console.error('Error copying wallet address:', error)
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
            document.cookie =
              'launchpad-privy-user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            document.cookie = 'privy-user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          })

          // Logout from Privy
          await privyLogout()
        } catch (privyError) {
          console.error('Error during Privy logout:', { error: privyError })
        }

        // Clear user data
        if (onSignOut) {
          await onSignOut()
        }
      }

      router.push('/login?fromLogout=true')
    } catch (error) {
      console.error('Error disconnecting wallet:', { error })
      router.push('/login?fromLogout=true')
    }
  }

  // Don't show if not ready
  // if (!ready) {
  //   return null
  // }

  // If not authenticated, show connect button
  if (!authenticated) {
    return (
      <Button
        variant='outline'
        onClick={() => login()}
        className='h-9 rounded-full border border-white/10 bg-white/5 px-4 font-medium text-white text-xs shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10'
      >
        <Wallet className='mr-2 h-3.5 w-3.5' />
        Connect Wallet
      </Button>
    )
  }

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Connected'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='relative z-50 h-9 rounded-full border border-white/10 bg-white/5 px-4 font-medium text-white text-xs shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10'
        >
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' />
            <span className='font-mono'>{truncatedAddress}</span>
          </div>
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
