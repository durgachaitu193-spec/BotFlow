import { useContext } from 'react'
import { SessionContext, type SessionHookResult } from '@/app/_shell/providers/session-provider'

export function useSession(): SessionHookResult {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error(
      'SessionProvider is not mounted. Wrap your app with <SessionProvider> in app/layout.tsx.'
    )
  }
  return ctx
}

// Stub client for compatibility - these methods need to be replaced with API calls
// TODO: Replace all client.* calls with direct API fetch calls
export const client = {
  getSession: async () => {
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    if (!response.ok) {
      return { data: null, error: new Error('Failed to get session') }
    }
    const data = await response.json()
    return { data }
  },
  organization: {
    list: async () => {
      const response = await fetch('/api/organizations', { credentials: 'include' })
      if (!response.ok) {
        return { data: [], error: new Error('Failed to list organizations') }
      }
      const data = await response.json()
      return { data: data.organizations || [] }
    },
    getFullOrganization: async (params?: { organizationId?: string }) => {
      const orgId = params?.organizationId
      const url = orgId ? `/api/organizations/${orgId}` : '/api/organizations/active'
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) {
        return { data: null, error: new Error('Failed to get organization') }
      }
      const data = await response.json()
      return { data }
    },
    create: async (params: { name: string; slug?: string }) => {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      })
      if (!response.ok) {
        return { data: null, error: new Error('Failed to create organization') }
      }
      const data = await response.json()
      return { data: { id: data.organizationId, ...data } }
    },
    setActive: async (params: { organizationId: string }) => {
      // TODO: Create API route for setting active organization
      console.warn('client.organization.setActive is not yet implemented')
      return { data: null }
    },
    getInvitation: async (params: { token: string }) => {
      const response = await fetch(`/api/invite/${params.token}`, { credentials: 'include' })
      if (!response.ok) {
        return { data: null, error: new Error('Failed to get invitation') }
      }
      const data = await response.json()
      return { data }
    },
  },
  subscription: {
    list: async (params?: { query?: { referenceId?: string } }) => {
      const refId = params?.query?.referenceId
      const url = refId ? `/api/subscriptions?referenceId=${refId}` : '/api/subscriptions'
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) {
        return { data: [], error: new Error('Failed to list subscriptions') }
      }
      const data = await response.json()
      return { data: Array.isArray(data) ? data : data.subscriptions || [] }
    },
  },
  oauth2: {
    link: async (params: { providerId: string; callbackURL: string }) => {
      // Redirect to OAuth authorization endpoint
      window.location.href = `/api/auth/oauth/authorize?provider=${params.providerId}&callback=${encodeURIComponent(params.callbackURL)}`
      return { success: true }
    },
  },
}

// Stub hooks for compatibility
export function useSubscription() {
  return {
    upgrade: async (params: any) => {
      console.warn('useSubscription().upgrade is not yet implemented')
      throw new Error('Subscription upgrade not yet implemented')
    },
  }
}

export function useActiveOrganization() {
  // TODO: Implement active organization fetching from API
  return {
    data: null,
  }
}
