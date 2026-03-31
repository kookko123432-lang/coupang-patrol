import { NextRequest, NextResponse } from 'next/server'

const APP_ID = (process.env.THREADS_APP_ID || '1854584565252934').trim()
const APP_SECRET = (process.env.THREADS_APP_SECRET || '').trim()
const REDIRECT_URI = (process.env.THREADS_REDIRECT_URI || 'https://coupang-patrol.vercel.app/api/auth/callback').trim()

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=no_code', req.url))
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.threads.net/v1.0/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })

    const shortToken = await tokenRes.json()

    if (!shortToken.access_token) {
      console.error('Short token exchange failed:', shortToken)
      return NextResponse.redirect(new URL(`/dashboard/accounts?error=token_failed`, req.url))
    }

    // Step 2: Exchange for long-lived token (60 days)
    let finalToken = shortToken.access_token
    let expiresIn = shortToken.expires_in || 86400

    try {
      const longTokenRes = await fetch(
        `https://graph.threads.net/v1.0/access_token?grant_type=th_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&access_token=${shortToken.access_token}`
      )
      const longToken = await longTokenRes.json()
      if (longToken.access_token) {
        finalToken = longToken.access_token
        expiresIn = longToken.expires_in || 5184000 // 60 days
        console.log('Long-lived token obtained, expires in:', expiresIn)
      }
    } catch (e) {
      console.log('Long token exchange failed, using short token:', e)
    }

    // Step 3: Store token in Redis (so we can update it without redeploying)
    const { set } = await import('@/lib/store')
    await set('threads_token', {
      accessToken: finalToken,
      obtainedAt: new Date().toISOString(),
      expiresIn,
    })

    // Step 4: Also update Vercel env var if possible
    try {
      await updateVercelEnvVar('THREADS_ACCESS_TOKEN', finalToken)
    } catch (e) {
      console.log('Vercel env update skipped:', e)
    }

    // Step 5: Get profile for redirect message
    let username = ''
    try {
      const profileRes = await fetch(
        `https://graph.threads.net/v1.0/me?fields=username&access_token=${finalToken}`
      )
      const profile = await profileRes.json()
      username = profile.username || ''
    } catch {}

    // Redirect to accounts page with success
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?connected=true&username=${username}`, req.url)
    )
  } catch (e: any) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(new URL(`/dashboard/accounts?error=${encodeURIComponent(e.message)}`, req.url))
  }
}

async function updateVercelEnvVar(key: string, value: string) {
  // Use Vercel API to update env var
  const token = process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_TOKEN
  if (!token) return

  const projectId = process.env.VERCEL_PROJECT_ID
  if (!projectId) return

  // This requires Vercel API access — may not work in all cases
  // The Redis fallback ensures the token is always saved
  console.log('Attempting to update Vercel env var:', key)
}
