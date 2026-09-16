import { randomUUID } from 'crypto'
import { account, db } from '@botflow/db'
import { createLogger } from '@botflow/logger'
import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/core/config/env'
import { getBaseUrl } from '@/lib/core/utils/urls'

const logger = createLogger('OAuthCallback')

/**
 * GET /api/auth/oauth/callback/[providerId]
 * Handle OAuth2 callback from provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      logger.error('OAuth error from provider', { error, providerId })
      const errorDescription = searchParams.get('error_description')
      const callbackURL = getBaseUrl() // Fallback to base URL

      // Try to get callback URL from cookie if available
      const cookieStore = await cookies()
      // We'll need to check all oauth-state cookies to find the right one

      return NextResponse.redirect(
        `${callbackURL}?oauth_error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      logger.error('Missing code or state in OAuth callback', { providerId })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Missing authorization code or state')}`
      )
    }

    // Retrieve OAuth state from cookie
    const cookieStore = await cookies()
    const stateCookie = cookieStore.get(`oauth-state-${state}`)

    if (!stateCookie) {
      logger.error('OAuth state cookie not found', { state, providerId })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Invalid or expired OAuth state')}`
      )
    }

    let oauthState: {
      userId: string
      providerId: string
      codeVerifier: string
      callbackURL: string
    }

    try {
      oauthState = JSON.parse(stateCookie.value)
    } catch (parseError) {
      logger.error('Failed to parse OAuth state cookie', { error: parseError, providerId })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Invalid OAuth state format')}`
      )
    }

    // Validate state matches
    if (oauthState.providerId !== providerId) {
      logger.error('Provider ID mismatch', {
        expected: oauthState.providerId,
        received: providerId,
      })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Provider mismatch')}`
      )
    }

    // Get provider config
    const providerConfig = getProviderConfig(providerId)
    if (!providerConfig) {
      logger.error('Provider config not found', { providerId })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Unsupported provider')}`
      )
    }

    // Exchange authorization code for access token
    // Some providers use Basic Auth, others use form data
    const tokenHeaders: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    let tokenBody: URLSearchParams | string

    if (providerConfig.usesBasicAuth) {
      // Use Basic Auth for providers like Linear and Reddit
      const credentials = Buffer.from(
        `${providerConfig.clientId!}:${providerConfig.clientSecret!}`
      ).toString('base64')
      tokenHeaders.Authorization = `Basic ${credentials}`
      tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: providerConfig.redirectURI,
        code_verifier: oauthState.codeVerifier,
      })
    } else {
      // Standard form data for most providers
      tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: providerConfig.redirectURI,
        client_id: providerConfig.clientId!,
        client_secret: providerConfig.clientSecret!,
        code_verifier: oauthState.codeVerifier,
      })
    }

    const tokenResponse = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: tokenBody,
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      logger.error('Failed to exchange code for token', {
        status: tokenResponse.status,
        error: errorText,
        providerId,
      })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('Failed to exchange authorization code')}`
      )
    }

    // Handle different token response formats
    let tokenData: any
    const contentType = tokenResponse.headers.get('content-type')
    const responseText = await tokenResponse.text()

    if (contentType?.includes('application/json')) {
      try {
        tokenData = JSON.parse(responseText)
      } catch (parseError) {
        logger.error('Failed to parse JSON token response', { error: parseError, providerId })
        return NextResponse.redirect(
          `${getBaseUrl()}?oauth_error=${encodeURIComponent('Invalid token response format')}`
        )
      }
    } else {
      // Some providers (like GitHub) return form-encoded responses
      const params = new URLSearchParams(responseText)
      tokenData = {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in')
          ? Number.parseInt(params.get('expires_in')!)
          : undefined,
        id_token: params.get('id_token'),
        token_type: params.get('token_type'),
        scope: params.get('scope'),
      }
    }

    // Handle provider-specific token response formats
    let accessToken: string | undefined
    let refreshToken: string | undefined
    let expiresIn: number | undefined
    let idToken: string | undefined

    if (providerId === 'slack') {
      // Slack returns: { ok: true, authed_user: { access_token, ... }, access_token, ... }
      if (tokenData.ok) {
        accessToken = tokenData.authed_user?.access_token || tokenData.access_token
        refreshToken = tokenData.refresh_token
        // Slack doesn't provide expires_in in the same format
        expiresIn = undefined
      }
    } else if (providerId === 'github-repo') {
      // GitHub returns form-encoded or JSON with access_token
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token
      expiresIn = tokenData.expires_in
    } else {
      // Standard OAuth2 token response
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token
      expiresIn = tokenData.expires_in
      idToken = tokenData.id_token
    }

    if (!accessToken) {
      logger.error('No access token in token response', { providerId })
      return NextResponse.redirect(
        `${getBaseUrl()}?oauth_error=${encodeURIComponent('No access token received')}`
      )
    }

    // Calculate token expiration
    const accessTokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    // Get user info (if available)
    let accountId: string | undefined
    let email: string | undefined
    let name: string | undefined

    if (idToken) {
      try {
        // Decode JWT to get user info
        const base64Url = idToken.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          Buffer.from(base64, 'base64')
            .toString()
            .split('')
            .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join('')
        )
        const decoded = JSON.parse(jsonPayload)
        accountId = decoded.sub || decoded.id || decoded.email
        email = decoded.email
        name = decoded.name || decoded.given_name || email?.split('@')[0]
      } catch (decodeError) {
        logger.warn('Failed to decode ID token', { error: decodeError, providerId })
      }
    }

    // If we don't have accountId from ID token, try to fetch from provider's userinfo endpoint
    // For some providers (e.g. Notion) we should always hit userinfo since they don't provide ID tokens.
    if ((!accountId || providerId === 'notion') && providerConfig.userInfoUrl) {
      try {
        const userInfoHeaders: HeadersInit = {
          Authorization: `Bearer ${accessToken}`,
        }

        // Provider-specific headers
        if (providerId === 'github-repo') {
          userInfoHeaders['User-Agent'] = 'sim-studio'
        } else if (providerId === 'linear') {
          // Linear uses GraphQL, so we need to send a GraphQL query
          userInfoHeaders['Content-Type'] = 'application/json'
        } else if (providerId === 'notion') {
          // Notion requires a version header for most API calls, including /v1/users/me.
          userInfoHeaders['Notion-Version'] = '2022-06-28'
        }

        let userInfoResponse: Response
        if (providerId === 'linear') {
          // Linear GraphQL query
          const graphqlQuery = {
            query: `
              query {
                viewer {
                  id
                  name
                  email
                }
              }
            `,
          }
          userInfoResponse = await fetch(providerConfig.userInfoUrl, {
            method: 'POST',
            headers: userInfoHeaders,
            body: JSON.stringify(graphqlQuery),
          })
        } else {
          userInfoResponse = await fetch(providerConfig.userInfoUrl, {
            headers: userInfoHeaders,
          })
        }

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json()

          // Handle provider-specific response formats
          if (providerId === 'linear') {
            // Linear GraphQL response: { data: { viewer: { id, name, email } } }
            const viewer = userInfo.data?.viewer
            if (viewer) {
              accountId = viewer.id
              email = viewer.email || email
              name = viewer.name || name
            }
          } else if (providerId === 'slack') {
            // Slack response: { ok: true, user: { id, name, email } }
            if (userInfo.ok && userInfo.user) {
              accountId = userInfo.user.id
              email = userInfo.user.email || email
              name = userInfo.user.name || name
            }
          } else if (providerId === 'github-repo') {
            // GitHub response: { id, login, name, email }
            accountId = userInfo.id?.toString() || userInfo.login
            email = userInfo.email || email
            name = userInfo.name || userInfo.login || name
          } else if (providerId === 'x') {
            // X/Twitter response: { data: { id, name, username } }
            if (userInfo.data) {
              accountId = userInfo.data.id
              name = userInfo.data.name || userInfo.data.username || name
            }
          } else if (providerId === 'notion') {
            // Notion response: { id, name, person: { email } } or { id, name, bot: { owner: { user: { ... } } } }
            // Prefer Notion's stable user id; use email if available (requires integration capability).
            const notionId = userInfo.id
            const notionName = userInfo.name || userInfo.bot?.owner?.user?.name
            const notionEmail =
              userInfo.person?.email ||
              userInfo.bot?.owner?.user?.person?.email ||
              userInfo.bot?.owner?.user?.email

            name = notionName || name
            email = notionEmail || email

            // If provider returned a real email, use it; otherwise use Notion id.
            if (
              typeof notionEmail === 'string' &&
              notionEmail.includes('@') &&
              !notionEmail.includes('@reown.local') &&
              !notionEmail.includes('@notion.user') &&
              !notionEmail.includes('@local')
            ) {
              accountId = notionEmail
            } else if (typeof notionId === 'string' && notionId.length > 0) {
              accountId = notionId
            }
          } else {
            // Standard OAuth2 userinfo format
            accountId = userInfo.sub || userInfo.id || userInfo.user_id || userInfo.email
            email = userInfo.email || userInfo.emailAddress || email
            name = userInfo.name || userInfo.displayName || userInfo.given_name || name
          }
        }
      } catch (userInfoError) {
        logger.warn('Failed to fetch user info', { error: userInfoError, providerId })
      }
    }

    // Use ONLY provider-derived details for accountId (no DB fallback).
    // Prefer a real provider email if present; otherwise keep provider-provided accountId; otherwise generate.
    if (
      typeof email === 'string' &&
      email.includes('@') &&
      !email.includes('@reown.local') &&
      !email.includes('@notion.user') &&
      !email.includes('@local')
    ) {
      accountId = email
    }

    if (!accountId) {
      accountId = `${providerId}-${Date.now()}`
    }

    // Check if account already exists
    const existingAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, oauthState.userId), eq(account.providerId, providerId)))
      .limit(1)

    const now = new Date()

    if (existingAccounts.length > 0) {
      // Update existing account
      await db
        .update(account)
        .set({
          accessToken,
          refreshToken: refreshToken || existingAccounts[0].refreshToken,
          accessTokenExpiresAt,
          idToken,
          accountId,
          scope: tokenData.scope || existingAccounts[0].scope || null,
          updatedAt: now,
        })
        .where(eq(account.id, existingAccounts[0].id))

      logger.info('Updated existing OAuth account', {
        userId: oauthState.userId,
        providerId,
        accountId,
      })
    } else {
      // Create new account
      await db.insert(account).values({
        id: randomUUID(),
        userId: oauthState.userId,
        providerId,
        accountId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        idToken,
        scope: tokenData.scope || null,
        createdAt: now,
        updatedAt: now,
      })

      logger.info('Created new OAuth account', {
        userId: oauthState.userId,
        providerId,
        accountId,
      })
    }

    // Clear the OAuth state cookie
    const response = NextResponse.redirect(oauthState.callbackURL)
    response.cookies.delete(`oauth-state-${state}`)

    // Set success parameter in URL
    const redirectUrl = new URL(oauthState.callbackURL)
    redirectUrl.searchParams.set('oauth_success', 'true')
    redirectUrl.searchParams.set('provider', providerId)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    logger.error('OAuth callback error', { error, providerId: (await params).providerId })
    return NextResponse.redirect(
      `${getBaseUrl()}?oauth_error=${encodeURIComponent('OAuth callback failed')}`
    )
  }
}

function getProviderConfig(providerId: string) {
  const baseUrl = getBaseUrl()

  // Helper functions to get client credentials
  const getClientId = (id: string): string | undefined => {
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
      asana: getEnv('ASANA_CLIENT_ID'),
      pipedrive: getEnv('PIPEDRIVE_CLIENT_ID'),
      hubspot: getEnv('HUBSPOT_CLIENT_ID'),
      salesforce: getEnv('SALESFORCE_CLIENT_ID'),
      linkedin: getEnv('LINKEDIN_CLIENT_ID'),
      zoom: getEnv('ZOOM_CLIENT_ID'),
      wordpress: getEnv('WORDPRESS_CLIENT_ID'),
    }
    return mapping[id]
  }

  const getClientSecret = (id: string): string | undefined => {
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
    return mapping[id]
  }

  const getTokenUrl = (id: string): string => {
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
      webflow: 'https://api.webflow.com/oauth/access_token',
      dropbox: 'https://api.dropboxapi.com/oauth2/token',
      asana: 'https://app.asana.com/-/oauth_token',
      pipedrive: 'https://oauth.pipedrive.com/oauth/token',
      hubspot: 'https://api.hubapi.com/oauth/v1/token',
      salesforce: 'https://login.salesforce.com/services/oauth2/token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
      zoom: 'https://zoom.us/oauth/token',
      wordpress: 'https://public-api.wordpress.com/oauth2/token',
    }
    return mapping[id] || ''
  }

  const getUserInfoUrl = (id: string): string | undefined => {
    const mapping: Record<string, string | undefined> = {
      'github-repo': 'https://api.github.com/user',
      'google-email': 'https://www.googleapis.com/oauth2/v2/userinfo',
      'google-calendar': 'https://www.googleapis.com/oauth2/v2/userinfo',
      'google-drive': 'https://www.googleapis.com/oauth2/v2/userinfo',
      'google-docs': 'https://www.googleapis.com/oauth2/v2/userinfo',
      'google-sheets': 'https://www.googleapis.com/oauth2/v2/userinfo',
      'google-forms': 'https://www.googleapis.com/oauth2/v2/userinfo',
      supabase: undefined, // Supabase doesn't have a standard userinfo endpoint
      x: 'https://api.x.com/2/users/me',
      confluence: 'https://api.atlassian.com/me',
      jira: 'https://api.atlassian.com/me',
      airtable: undefined, // Airtable doesn't have a standard userinfo endpoint
      notion: 'https://api.notion.com/v1/users/me',
      discord: 'https://discord.com/api/v10/users/@me',
      'microsoft-excel': 'https://graph.microsoft.com/v1.0/me',
      'microsoft-teams': 'https://graph.microsoft.com/v1.0/me',
      'microsoft-planner': 'https://graph.microsoft.com/v1.0/me',
      sharepoint: 'https://graph.microsoft.com/v1.0/me',
      outlook: 'https://graph.microsoft.com/v1.0/me',
      onedrive: 'https://graph.microsoft.com/v1.0/me',
      linear: 'https://api.linear.app/graphql', // Linear uses GraphQL
      slack: 'https://slack.com/api/users.identity',
      reddit: 'https://oauth.reddit.com/api/v1/me',
      wealthbox: undefined, // Check provider docs
      webflow: 'https://api.webflow.com/v2/sites', // Webflow doesn't have userinfo, but we can use sites endpoint
      dropbox: 'https://api.dropboxapi.com/2/users/get_current_account',
      asana: 'https://app.asana.com/api/1.0/users/me',
      pipedrive: 'https://api.pipedrive.com/v1/users/me',
      hubspot: 'https://api.hubapi.com/oauth/v1/access-tokens/info',
      salesforce: 'https://login.salesforce.com/services/oauth2/userinfo',
      linkedin: 'https://api.linkedin.com/v2/userinfo',
      zoom: 'https://api.zoom.us/v2/users/me',
      wordpress: 'https://public-api.wordpress.com/rest/v1.1/me',
    }
    return mapping[id]
  }

  // Check if provider uses Basic Auth for token exchange
  const usesBasicAuth = (id: string): boolean => {
    // Linear, Reddit, and Airtable use Basic Auth
    return id === 'linear' || id === 'reddit' || id === 'airtable' || id === 'notion'
  }

  const clientId = getClientId(providerId)
  const clientSecret = getClientSecret(providerId)
  const tokenUrl = getTokenUrl(providerId)
  const userInfoUrl = getUserInfoUrl(providerId)

  if (!clientId || !clientSecret || !tokenUrl) {
    return undefined
  }

  return {
    providerId,
    clientId,
    clientSecret,
    tokenUrl,
    userInfoUrl,
    redirectURI: `${baseUrl}/api/auth/oauth/callback/${providerId}`,
    usesBasicAuth: usesBasicAuth(providerId),
  }
}
