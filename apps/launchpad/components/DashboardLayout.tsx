'use client'

import React from 'react'
import { LaunchpadNavbar, type LaunchpadNavbarProps } from '@botflow/ui'
import clsx from 'clsx'
import Sidebar from '@/components/Sidebar'
import CreateToken from '@/create/components/createToken'

interface DashboardLayoutProps extends LaunchpadNavbarProps {
  children: React.ReactNode
}

export default function DashboardLayout({
  children,
  currentApp = 'launchpad',
  onSwitchApp,
  onSignOut,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  return (
    <div className='flex min-h-screen flex-col bg-bg-deep text-text-primary'>
      <LaunchpadNavbar
        currentApp={currentApp || 'launchpad'}
        onSwitchApp={onSwitchApp}
        onSignOut={onSignOut}
      />
      <div className='relative flex flex-1'>
        <Sidebar
          isCollapsed={isCollapsed}
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
        <div
          className={clsx(
            'flex flex-1 flex-col transition-all duration-300 ease-in-out',
            'md:pl-64',
            isCollapsed && 'md:!pl-20',
            'pl-0'
          )}
        >
          <main className='w-full flex-1 overflow-x-hidden p-4 md:p-6'>{children}</main>
        </div>
      </div>
      <CreateToken isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
