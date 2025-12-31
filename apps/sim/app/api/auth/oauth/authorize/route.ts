import { db, user } from '@sim/db'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/core/config/env'
import { createLogger } from '@sim/logger'
import { OAUTH_PROVIDERS } from '@/lib/oauth/oauth'
import { getBaseUrl } from '@/lib/core/utils/urls'

const logger = createLogger('OAuthAuthorize')

/**
 * GET /api/auth/oauth/authorize
 * Initiate OAuth2 flow for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const privyUserId = cookieStore.get('sim-privy-user-id')?.value

    if (!privyUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user exists
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, privyUserId))
      .limit(1)

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const providerId = searchParams.get('provider')
    const callbackURL =
      searchParams.get('callback') || request.headers.get('referer') || getBaseUrl()

    if (!providerId) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 })
    }

    // Find provider config from OAUTH_PROVIDERS
    const providerConfig = getProviderConfig(providerId)

    if (!providerConfig) {
      return NextResponse.json({ error: `Unsupported provider: ${providerId}` }, { status: 400 })
    }

    // Validate that clientId is present
    if (!providerConfig.clientId) {
      logger.error('Missing client ID for provider', { providerId })
      return NextResponse.json(
        {
          error: `OAuth configuration error: Missing client ID for provider ${providerId}. Please configure the required environment variables.`,
        },
        { status: 500 }
      )
    }

    // Validate that scopes are present (required by OAuth2 spec)
    if (!providerConfig.scopes || providerConfig.scopes.length === 0) {
      logger.error('Missing scopes for provider', { providerId })
      return NextResponse.json(
        {
          error: `OAuth configuration error: Missing scopes for provider ${providerId}. Scopes are required for OAuth2 authorization.`,
        },
        { status: 500 }
      )
    }

    // Generate state and PKCE verifier
    const { randomBytes } = await import('crypto')
    const state = randomBytes(32).toString('hex')
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(providerConfig, state, codeChallenge, callbackURL)

    // Store OAuth state in cookies (will be validated in callback)
    const response = NextResponse.redirect(authUrl)
    response.cookies.set(
      `oauth-state-${state}`,
      JSON.stringify({
        state,
        codeVerifier,
        providerId,
        userId: privyUserId,
        callbackURL,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60, // 10 minutes
        path: '/',
      }
    )

    logger.info('Initiating OAuth flow', {
      providerId,
      userId: privyUserId,
      callbackURL,
    })

    return response
  } catch (error) {
    logger.error('Error initiating OAuth flow', { error })
    return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 })
  }
}

function getProviderConfig(providerId: string) {
  const baseUrl = getBaseUrl()

  // First, try to find the service by providerId in OAUTH_PROVIDERS
  for (const provider of Object.values(OAUTH_PROVIDERS)) {
    if (provider && typeof provider === 'object' && 'services' in provider) {
      const services = provider.services as Record<string, any>
      for (const service of Object.values(services)) {
        if (service && service.providerId === providerId) {
          return {
            providerId: service.providerId,
            clientId: getClientId(providerId),
            clientSecret: getClientSecret(providerId),
            authorizationUrl: getAuthorizationUrl(providerId),
            tokenUrl: getTokenUrl(providerId),
            scopes: service.scopes || [],
            redirectURI: `${baseUrl}/api/auth/oauth/callback/${providerId}`,
          }
        }
      }
    }
  }

  // Check OAUTH_PROVIDERS by direct key match (fallback)
  const provider = (OAUTH_PROVIDERS as any)[providerId]
  if (provider && typeof provider === 'object' && 'services' in provider) {
    const services = provider.services as Record<string, any>
    const defaultService = provider.defaultService
    const service = defaultService ? services[defaultService] : Object.values(services)[0]
    if (service) {
      return {
        providerId: service.providerId || providerId,
        clientId: getClientId(providerId),
        clientSecret: getClientSecret(providerId),
        authorizationUrl: getAuthorizationUrl(providerId),
        tokenUrl: getTokenUrl(providerId),
        scopes: service.scopes || [],
        redirectURI: `${baseUrl}/api/auth/oauth/callback/${providerId}`,
      }
    }
  }

  return null
}

function getClientId(providerId: string): string {
  // Map provider IDs to environment variables
  const mapping: Record<string, string | undefined> = {
    'github-repo': getEnv('GITHUB_REPO_CLIENT_ID'),
    'google-email': getEnv('GOOGLE_CLIENT_ID'),
    'google-calendar': getEnv('GOOGLE_CLIENT_ID'),
    'google-drive': getEnv('GOOGLE_CLIENT_ID'),
    'google-docs': getEnv('GOOGLE_CLIENT_ID'),
    'google-sheets': getEnv('GOOGLE_CLIENT_ID'),
    'google-forms': getEnv('GOOGLE_CLIENT_ID'),
    supabase: getEnv('SUPABASE_CLIENT_ID'),
    x: getEnv('X_CLIENT_ID'),
    confluence: getEnv('CONFLUENCE_CLIENT_ID'),
    jira: getEnv('JIRA_CLIENT_ID'),
    airtable: getEnv('AIRTABLE_CLIENT_ID'),
    notion: getEnv('NOTION_CLIENT_ID'),
    discord: getEnv('DISCORD_CLIENT_ID'),
    'microsoft-excel': getEnv('MICROSOFT_CLIENT_ID'),
    'microsoft-teams': getEnv('MICROSOFT_CLIENT_ID'),
    'microsoft-planner': getEnv('MICROSOFT_CLIENT_ID'),
    sharepoint: getEnv('MICROSOFT_CLIENT_ID'),
    outlook: getEnv('MICROSOFT_CLIENT_ID'),
    onedrive: getEnv('MICROSOFT_CLIENT_ID'),
    linear: getEnv('LINEAR_CLIENT_ID'),
    slack: getEnv('SLACK_CLIENT_ID'),
    reddit: getEnv('REDDIT_CLIENT_ID'),
    wealthbox: getEnv('WEALTHBOX_CLIENT_ID'),
    webflow: getEnv('WEBFLOW_CLIENT_ID'),
    dropbox: getEnv('DROPBOX_CLIENT_ID'),
    trello: getEnv('TRELLO_API_KEY'), // Note: Trello uses API key, not client ID
    asana: getEnv('ASANA_CLIENT_ID'),
    pipedrive: getEnv('PIPEDRIVE_CLIENT_ID'),
    hubspot: getEnv('HUBSPOT_CLIENT_ID'),
    salesforce: getEnv('SALESFORCE_CLIENT_ID'),
    linkedin: getEnv('LINKEDIN_CLIENT_ID'),
    zoom: getEnv('ZOOM_CLIENT_ID'),
    wordpress: getEnv('WORDPRESS_CLIENT_ID'),
  }

  return mapping[providerId] || ''
}

function getClientSecret(providerId: string): string {
  const mapping: Record<string, string | undefined> = {
    'github-repo': getEnv('GITHUB_REPO_CLIENT_SECRET'),
    'google-email': getEnv('GOOGLE_CLIENT_SECRET'),
    'google-calendar': getEnv('GOOGLE_CLIENT_SECRET'),
    'google-drive': getEnv('GOOGLE_CLIENT_SECRET'),
    'google-docs': getEnv('GOOGLE_CLIENT_SECRET'),
    'google-sheets': getEnv('GOOGLE_CLIENT_SECRET'),
    'google-forms': getEnv('GOOGLE_CLIENT_SECRET'),
    supabase: getEnv('SUPABASE_CLIENT_SECRET'),
    x: getEnv('X_CLIENT_SECRET'),
    confluence: getEnv('CONFLUENCE_CLIENT_SECRET'),
    jira: getEnv('JIRA_CLIENT_SECRET'),
    airtable: getEnv('AIRTABLE_CLIENT_SECRET'),
    notion: getEnv('NOTION_CLIENT_SECRET'),
    discord: getEnv('DISCORD_CLIENT_SECRET'),
    'microsoft-excel': getEnv('MICROSOFT_CLIENT_SECRET'),
    'microsoft-teams': getEnv('MICROSOFT_CLIENT_SECRET'),
    'microsoft-planner': getEnv('MICROSOFT_CLIENT_SECRET'),
    sharepoint: getEnv('MICROSOFT_CLIENT_SECRET'),
    outlook: getEnv('MICROSOFT_CLIENT_SECRET'),
    onedrive: getEnv('MICROSOFT_CLIENT_SECRET'),
    linear: getEnv('LINEAR_CLIENT_SECRET'),
    slack: getEnv('SLACK_CLIENT_SECRET'),
    reddit: getEnv('REDDIT_CLIENT_SECRET'),
    wealthbox: getEnv('WEALTHBOX_CLIENT_SECRET'),
    webflow: getEnv('WEBFLOW_CLIENT_SECRET'),
    dropbox: getEnv('DROPBOX_CLIENT_SECRET'),
    trello: undefined, // Trello doesn't use client secret
    asana: getEnv('ASANA_CLIENT_SECRET'),
    pipedrive: getEnv('PIPEDRIVE_CLIENT_SECRET'),
    hubspot: getEnv('HUBSPOT_CLIENT_SECRET'),
    salesforce: getEnv('SALESFORCE_CLIENT_SECRET'),
    linkedin: getEnv('LINKEDIN_CLIENT_SECRET'),
    zoom: getEnv('ZOOM_CLIENT_SECRET'),
    wordpress: getEnv('WORDPRESS_CLIENT_SECRET'),
  }

  return mapping[providerId] || ''
}

function getAuthorizationUrl(providerId: string): string {
  const mapping: Record<string, string> = {
    'github-repo': 'https://github.com/login/oauth/authorize',
    'google-email': 'https://accounts.google.com/o/oauth2/v2/auth',
    'google-calendar': 'https://accounts.google.com/o/oauth2/v2/auth',
    'google-drive': 'https://accounts.google.com/o/oauth2/v2/auth',
    'google-docs': 'https://accounts.google.com/o/oauth2/v2/auth',
    'google-sheets': 'https://accounts.google.com/o/oauth2/v2/auth',
    'google-forms': 'https://accounts.google.com/o/oauth2/v2/auth',
    supabase: 'https://api.supabase.com/v1/oauth/authorize',
    x: 'https://twitter.com/i/oauth2/authorize',
    confluence: 'https://auth.atlassian.com/authorize',
    jira: 'https://auth.atlassian.com/authorize',
    airtable: 'https://airtable.com/oauth2/v1/authorize',
    notion: 'https://api.notion.com/v1/oauth/authorize',
    discord: 'https://discord.com/api/oauth2/authorize',
    'microsoft-excel': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    'microsoft-teams': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    'microsoft-planner': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    sharepoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    onedrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    linear: 'https://linear.app/oauth/authorize',
    slack: 'https://slack.com/oauth/v2/authorize',
    reddit: 'https://www.reddit.com/api/v1/authorize',
    wealthbox: 'https://app.crmworkspace.com/oauth/authorize',
    webflow: 'https://api.webflow.com/oauth/authorize',
    dropbox: 'https://www.dropbox.com/oauth2/authorize',
    asana: 'https://app.asana.com/-/oauth_authorize',
    pipedrive: 'https://oauth.pipedrive.com/oauth/authorize',
    hubspot: 'https://app.hubspot.com/oauth/authorize',
    salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
    linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
    zoom: 'https://zoom.us/oauth/authorize',
    wordpress: 'https://public-api.wordpress.com/oauth2/authorize',
  }
  return mapping[providerId] || ''
}

function getTokenUrl(providerId: string): string {
  const mapping: Record<string, string> = {
    'github-repo': 'https://github.com/login/oauth/access_token',
    'google-email': 'https://oauth2.googleapis.com/token',
    'google-calendar': 'https://oauth2.googleapis.com/token',
    'google-drive': 'https://oauth2.googleapis.com/token',
    'google-docs': 'https://oauth2.googleapis.com/token',
    'google-sheets': 'https://oauth2.googleapis.com/token',
    'google-forms': 'https://oauth2.googleapis.com/token',
    supabase: 'https://api.supabase.com/v1/oauth/token',
    x: 'https://api.x.com/2/oauth2/token',
    confluence: 'https://auth.atlassian.com/oauth/token',
    jira: 'https://auth.atlassian.com/oauth/token',
    airtable: 'https://airtable.com/oauth2/v1/token',
    notion: 'https://api.notion.com/v1/oauth/token',
    discord: 'https://discord.com/api/oauth2/token',
    'microsoft-excel': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    'microsoft-teams': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    'microsoft-planner': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    sharepoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    onedrive: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    linear: 'https://api.linear.app/oauth/token',
    slack: 'https://slack.com/api/oauth.v2.access',
    reddit: 'https://www.reddit.com/api/v1/access_token',
    wealthbox: 'https://app.crmworkspace.com/oauth/token',
    webflow: 'https://api.webflow.com/oauth/token',
    dropbox: 'https://api.dropboxapi.com/oauth2/token',
    asana: 'https://app.asana.com/-/oauth_token',
    pipedrive: 'https://oauth.pipedrive.com/oauth/token',
    hubspot: 'https://api.hubapi.com/oauth/v1/token',
    salesforce: 'https://login.salesforce.com/services/oauth2/token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    zoom: 'https://zoom.us/oauth/token',
    wordpress: 'https://public-api.wordpress.com/oauth2/token',
  }
  return mapping[providerId] || ''
}

function buildAuthorizationUrl(
  config: any,
  state: string,
  codeChallenge: string,
  callbackURL: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectURI,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  // For Google providers, add prompt=consent to force consent screen
  if (config.providerId?.startsWith('google-') || config.authorizationUrl?.includes('accounts.google.com')) {
    params.set('prompt', 'consent')
    params.set('access_type', 'offline') // Ensures refresh token is provided
  }

  return `${config.authorizationUrl}?${params.toString()}`
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

