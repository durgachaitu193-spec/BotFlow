'use client'

import clsx from 'clsx'
import { WalletButton } from './WalletButton'

const isDev =
  process.env.NODE_ENV === 'development' ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
const LAUNCHPAD_URL = isDev
  ? 'http://localhost:3000'
  : process.env.NEXT_PUBLIC_LAUNCHPAD_URL || 'https://launchpad.megalith.run'
const BUILDER_URL = isDev
  ? 'http://localhost:3001'
  : process.env.NEXT_PUBLIC_BUILDER_URL || 'https://builder.megalith.run'

export interface LaunchpadNavbarProps {
  currentApp?: 'launchpad' | 'builder' | string
  onSwitchApp?: (app: 'launchpad' | 'builder') => void
  onSignOut?: () => Promise<void> | void
}

export function LaunchpadNavbar({ currentApp, onSwitchApp, onSignOut }: LaunchpadNavbarProps) {
  const bgColor = currentApp === 'launchpad' ? 'rgba(0, 249, 207, 0.16)' : 'rgba(255, 111, 0, 0.16)'

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
      style={{ backgroundColor: bgColor }}
    >
      <div className='flex items-center gap-6'>
        <img src='/logo/lockup_ow.png' alt='Megalith Labs' className='h-4 w-auto' />
      </div>

      <div className='flex items-center gap-4'>
        <div className='flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1'>
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
        </div>

        <div className='ml-2 flex items-center border-white/10 border-l pl-4'>
          <WalletButton onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  )
}
