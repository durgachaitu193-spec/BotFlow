'use client'

import React from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ChevronLeft, ChevronRight, Globe, ShoppingBag, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Overview', href: '/', icon: User },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Agents', href: '/explore', icon: Activity },
  { name: 'Network Graph', href: '/network', icon: Globe },
  // { name: "Docs", href: "/docs", icon: FileText },
  // { name: "Settings", href: "/settings", icon: Settings }
]

interface SidebarProps {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (isOpen: boolean) => void
  onCreateClick: () => void
}

export default function Sidebar({
  isCollapsed,
  toggleSidebar,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onCreateClick,
}: SidebarProps) {
  const pathname = usePathname()

  // Close mobile menu when path changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname, setIsMobileMenuOpen])

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden'
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 230,
        }}
        className={clsx(
          'fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] border-white/5 border-r bg-bg-card/50 backdrop-blur-xl',
          'transition-transform duration-300 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex h-full flex-col p-4'>
          <div
            className={clsx(
              'mb-8 flex items-center gap-3',
              isCollapsed ? 'justify-center px-0' : 'px-2'
            )}
          >
            {/* Logo removed */}
          </div>

          <div className='mb-4 px-2'>
            <button
              onClick={onCreateClick}
              className={clsx(
                'flex w-full items-center justify-center rounded-lg bg-accent-primary p-2.5 font-bold text-bg-deep text-sm transition-all hover:bg-accent-primary/90 hover:shadow-glow-primary',
                isCollapsed ? 'px-0' : 'gap-2'
              )}
            >
              <span className='text-xl leading-none'>+</span>
              {!isCollapsed && <span>Create Agent</span>}
            </button>
          </div>

          <nav className='flex-1 space-y-1'>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group relative flex w-full items-center rounded-lg py-2.5 font-medium text-sm transition-all duration-200',
                    isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary shadow-glow-primary'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )}
                >
                  <item.icon
                    className={clsx(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-accent-primary'
                        : 'text-text-muted group-hover:text-text-primary'
                    )}
                  />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='whitespace-nowrap'
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId='activeIndicator'
                      className='absolute left-0 h-8 w-1 rounded-r-full bg-accent-primary'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className='mt-auto space-y-4 border-white/5 border-t pt-4'>
            <div className={clsx('px-2 py-2', isCollapsed ? 'flex justify-center' : '')}>
              <div
                className={clsx(
                  'flex items-center gap-3 rounded-lg bg-white/5 p-2',
                  isCollapsed ? 'justify-center' : 'justify-between'
                )}
              />
            </div>

            <button
              onClick={toggleSidebar}
              className='hidden w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary md:flex'
            >
              {isCollapsed ? (
                <ChevronRight className='h-4 w-4' />
              ) : (
                <ChevronLeft className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
