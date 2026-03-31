import { NextRequest, NextResponse } from 'next/server'

const APP_ID = (process.env.THREADS_APP_ID || '1854584565252934').trim()
const APP_SECRET = (process.env.THREADS_APP_SECRET || '').trim()
const REDIRECT_URI = (process.env.THREADS_REDIRECT_URI || 'https://coupang-patrol.vercel.app/api/auth/callback').trim()

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const errParam = req.nextUrl.searchParams.get('error')

  if (errParam) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=' + encodeURIComponent(errParam), req.url))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=no_code', req.url))
  }

  try {
    // Step 1: Exchange code for token
    const tokenRes = await fetch('https://graph.threads.net/v1.0/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, grant_type: 'authorization_code', redirect_uri: REDIRECT_URI, code }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', JSON.stringify(tokenData))
      return NextResponse.redirect(new URL('/dashboard/accounts?error=token_failed', req.url))
    }

    let finalToken = tokenData.access_token
    let expiresIn = tokenData.expires_in || 86400

    // Step 2: Try long-lived token
    try {
      const longRes = await fetch(
        'https://graph.threads.net/v1.0/access_token?grant_type=th_exchange_token&client_id=' + APP_ID + '&client_secret=' + APP_SECRET + '&access_token=' + finalToken
      )
      const longData = await longRes.json()
      if (longData.access_token) {
        finalToken = longData.access_token
        expiresIn = longData.expires_in || 5184000
      }
    } catch {}

    // Step 3: Get profile
    const profileRes = await fetch('https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=' + finalToken)
    const profile = await profileRes.json()
    if (!profile.id) {
      console.error('Profile failed:', JSON.stringify(profile))
      return NextResponse.redirect(new URL('/dashboard/accounts?error=profile_failed', req.url))
    }

    // Step 4: Save token
    const store = await import('@/lib/store')
    await store.set('threads_token', { accessToken: finalToken, userId: profile.id, username: profile.username, obtainedAt: new Date().toISOString(), expiresIn })

    // Step 5: Save to accounts list
    const accountStore = await import('@/lib/account-store')
    const existing = await accountStore.getAccounts()
    const existingAcc = existing.find((a: any) => a.platform === 'threads' && a.platformUserId === String(profile.id))

    if (!existingAcc) {
      await accountStore.addAccount({ platform: 'threads', platformUserId: String(profile.iid), username: profile.username || '', name: profile.name || profile.username || '', accessToken: finalToken, connected: true })
      console.log('New account added:', profile.username)
    } else {
      await accountStore.updateAccount(existingAcc.id, { accessToken: finalToken, connected: true })
      console.log('Account token refreshed:', profile.username)
    }

    // Step 6: Redirect with success
    return NextResponse.redirect(new URL('/dashboard/accounts?connected=true&username=' + (profile.username || ''), req.url))
  } catch (e: any) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(new URL('/dashboard/accounts?error=' + encodeURIComponent(e.message), req.url))
  }
}
