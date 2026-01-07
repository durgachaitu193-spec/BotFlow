'use client'

import type React from 'react'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import posthog from 'posthog-js'

export type AppSession = {
  user: {
    id: string
    email: string
    emailVerified?: boolean
    name?: string | null
    image?: string | null
    createdAt?: Date
    updatedAt?: Date
  } | null
  session?: {
    id?: string
    userId?: string
    activeOrganizationId?: string
  }
} | null

export type SessionHookResult = {
  data: AppSession
  isPending: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export const SessionContext = createContext<SessionHookResult | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppSession>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadSession = useCallback(async (retryCount = 0) => {
    try {
      setIsPending(true)
      setError(null)
      console.log('[SessionProvider] Fetching session...', { retryCount })
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store', // Ensure we don't get a cached null session
      })
      const json = await res.json()
      console.log('[SessionProvider] Session loaded:', {
        hasUser: !!json?.data?.user,
        userId: json?.data?.user?.id,
      })
      setData(json?.data ?? null)
    } catch (e) {
      console.error('[SessionProvider] Error fetching session:', e)
      if (retryCount < 2) {
        console.log(`[SessionProvider] Retrying fetch (${retryCount + 1})...`)
        // Exponential backoff or simple delay
        await new Promise((resolve) => setTimeout(resolve, 500 * (retryCount + 1)))
        return loadSession(retryCount + 1)
      }
      setError(e instanceof Error ? e : new Error('Failed to fetch session'))
    } finally {
      setIsPending(false)
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    if (isPending || typeof posthog.identify !== 'function') {
      return
    }

    try {
      if (data?.user) {
        posthog.identify(data.user.id, {
          email: data.user.email,
          name: data.user.name,
          email_verified: data.user.emailVerified,
          created_at: data.user.createdAt,
        })
      } else {
        posthog.reset()
      }
    } catch {}
  }, [data, isPending])

  const value = useMemo<SessionHookResult>(
    () => ({ data, isPending, error, refetch: loadSession }),
    [data, isPending, error, loadSession]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
