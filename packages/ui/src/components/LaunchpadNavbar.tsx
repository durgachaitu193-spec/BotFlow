'use client'

import clsx from 'clsx'
import { WalletButton } from './WalletButton'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function Logo({ app = 'launchpad' }: { app?: 'launchpad' | 'builder' | string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine logo paths based on app
  // Determine logo paths based on app
  const getLogoPaths = () => {
    if (app === 'builder') {
      return {
        icon: resolvedTheme === 'dark' ? '/logo/botflow-icon-light.png' : '/logo/botflow-icon-dark.png',
        // "-light" is the light-coloured wordmark, so it belongs on the dark theme
        text: resolvedTheme === 'dark' ? '/logo/botflow-text-light.png' : '/logo/botflow-text-dark.png',
      }
    }
    // Launchpad specific branding - always use white text/dark mode assets
    return {
      icon: '/logo/botflow-icon-light.png',
      text: '/logo/botflow-text-light.png',
    }
  }

  if (!mounted) {
    const initialLogos = getLogoPaths()
    return (
      <div className="flex items-center gap-2 opacity-0">
        <img src={initialLogos.text} alt='BotFlow' className='h-7 w-auto' />
      </div>
    )
  }

  const { text } = getLogoPaths()

  return (
    <div className='flex items-center gap-2'>
      <img
        src={text}
        alt='BotFlow Text'
        className={app === 'builder'
          ? 'h-8 w-auto object-contain object-left'
          : 'h-7 w-auto object-contain object-left'
        }
      />
    </div>
  )
}

const isDev =
  process.env.NODE_ENV === 'development' ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
const LAUNCHPAD_URL = isDev
  ? 'http://localhost:3000'
  : process.env.NEXT_PUBLIC_LAUNCHPAD_URL || 'https://launchpad.botflow.ai'
const BUILDER_URL = isDev
  ? 'http://localhost:3001'
  : process.env.NEXT_PUBLIC_BUILDER_URL || 'https://studio.botflow.ai'

export interface LaunchpadNavbarProps {
  currentApp?: 'launchpad' | 'builder' | string
  onSwitchApp?: (app: 'launchpad' | 'builder') => void
  onSignOut?: () => Promise<void> | void
}

export function LaunchpadNavbar({ currentApp, onSwitchApp, onSignOut }: LaunchpadNavbarProps) {
  const bgColor = currentApp === 'launchpad' ? '#000000' : 'rgba(139, 195, 74, 0.16)'

  const handleSwitch = (app: 'launchpad' | 'builder') => {
    if (onSwitchApp) {
      onSwitchApp(app)
    } else {
      if (app === 'launchpad') {
        window.location.href = LAUNCHPAD_URL
      } else {
        window.location.href = `${BUILDER_URL}/workspace`
      }
    }
  }

  return (
    <header
      className='sticky top-0 z-50 flex h-16 w-full items-center justify-between border-white/5 border-b px-6 backdrop-blur-xl'
      style={{ backgroundColor: `var(--navbar-bg, ${bgColor})` }}
    >
      <div className='flex items-center gap-2'>
        <Logo app={currentApp} />
      </div>

      <div className='flex items-center gap-4'>
        {/* <div className='flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1'>
          <button
            onClick={() => handleSwitch('launchpad')}
            className={clsx(
              'rounded-full px-4 py-1.5 font-medium text-xs transition-all duration-200',
              currentApp === 'launchpad'
                ? 'bg-white/10 text-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            )}
          >
            Launchpad
          </button>

          <button
            onClick={() => handleSwitch('builder')}
            className={clsx(
              'rounded-full px-4 py-1.5 font-medium text-xs transition-all duration-200',
              currentApp === 'builder'
                ? 'bg-white/10 text-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            )}
          >
            Builder
          </button>
        </div> */}

        <div className='ml-2 flex items-center border-white/10 border-l pl-4'>
          <WalletButton onSignOut={onSignOut} logoutRedirectPath="/" />
        </div>
      </div>
    </header>
  )
}
