import { NextRequest, NextResponse } from 'next/server'
import { set } from '@/lib/store'
import { getAccounts, addAccount, updateAccount } from '@/lib/account-store'

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
    // Step 1: Exchange authorization code for short-lived access token
    // Docs: https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
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

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('Token exchange failed:', errText)
      return NextResponse.redirect(
        new URL('/dashboard/accounts?error=' + encodeURIComponent('Token exchange failed: ' + errText), req.url)
      )
    }

    const tokenData = await tokenRes.json()
    const shortLivedToken = tokenData.access_token
    const userId = tokenData.user_id

    if (!shortLivedToken) {
      return NextResponse.redirect(new URL('/dashboard/accounts?error=no_token', req.url))
    }

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    // Docs: https://developers.facebook.com/docs/threads/get-started/long-lived-tokens
    let finalToken = shortLivedToken
    let expiresIn = 3600 // default 1 hour

    try {
      const longLivedRes = await fetch(
        `https://graph.threads.net/v1.0/access_token?grant_type=th_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&access_token=${shortLivedToken}`
      )
      if (longLivedRes.ok) {
        const longLivedData = await longLivedRes.json()
        if (longLivedData.access_token) {
          finalToken = longLivedData.access_token
          expiresIn = longLivedData.expires_in || 5183944 // ~60 days
          console.log('Got long-lived token, expires in:', expiresIn)
        }
      } else {
        console.error('Long-lived token exchange failed (non-fatal):', await longLivedRes.text())
      }
    } catch (e) {
      console.error('Long-lived token exchange error (non-fatal):', e)
    }

    // Step 3: Get user profile
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${finalToken}`
    )
    const profile = await profileRes.json()

    if (!profile.id) {
      return NextResponse.redirect(new URL('/dashboard/accounts?error=profile_failed', req.url))
    }

    // Step 4: Save token to Redis
    await set('threads_token', {
      accessToken: finalToken,
      userId: profile.id,
      username: profile.username,
      obtainedAt: new Date().toISOString(),
      expiresIn,
    })

    // Step 5: Save to accounts list
    const existing = await getAccounts()
    const existingAcc = existing.find((a: any) => a.platform === 'threads' && a.platformUserId === String(profile.id))

    if (!existingAcc) {
      await addAccount({
        platform: 'threads',
        platformUserId: String(profile.id),
        username: profile.username || '',
        name: profile.name || profile.username || '',
        accessToken: finalToken,
        connected: true,
      })
    } else {
      await updateAccount(existingAcc.id, { accessToken: finalToken, connected: true })
    }

    // Step 6: Redirect with success
    return NextResponse.redirect(
      new URL('/dashboard/accounts?connected=true&username=' + (profile.username || ''), req.url)
    )
  } catch (e: any) {
    console.error('Auth callback error:', e)
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=' + encodeURIComponent(e.message), req.url)
    )
  }
}
