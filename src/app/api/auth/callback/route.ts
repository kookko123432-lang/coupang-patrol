import { NextRequest, NextResponse } from 'next/server'

const APP_ID = process.env.THREADS_APP_ID || '1855584565252934'
const APP_SECRET = process.env.THREADS_APP_SECRET || ''
const REDIRECT_URI = process.env.THREADS_REDIRECT_URI || 'https://coupang-patrol.vercel.app/api/auth/callback'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: '缺少授權碼' }, { status: 400 })
  }

  try {
    // Exchange code for short-lived token
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
      return NextResponse.json({ error: 'Token 交換失敗', details: shortToken }, { status: 400 })
    }

    // Exchange short-lived token for long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.threads.net/v1.0/access_token?grant_type=th_exchange_token&client_secret=${APP_SECRET}&access_token=${shortToken.access_token}`
    )

    const longToken = await longTokenRes.json()

    // Get user profile
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${longToken.access_token}`
    )
    const profile = await profileRes.json()

    // Success! Return HTML page showing the tokens
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Threads 授權成功</title>
  <style>
    body { font-family: system-ui; background: #0a0a0a; color: #e5e5e5; padding: 40px; }
    .card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
    h1 { color: #60a5fa; margin-top: 0; }
    .field { margin: 16px 0; }
    .label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .value { background: #111; border: 1px solid #333; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 13px; word-break: break-all; color: #4ade80; }
    .note { font-size: 13px; color: #fbbf24; margin-top: 20px; padding: 12px; background: #fbbf2410; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ Threads 授權成功！</h1>
    <p>你的 Threads 帳號已成功連結。以下是你的授權資訊：</p>
    
    <div class="field">
      <div class="label">Threads 用戶名</div>
      <div class="value">${profile.username || 'N/A'}</div>
    </div>
    
    <div class="field">
      <div class="label">Threads User ID</div>
      <div class="value">${profile.id || 'N/A'}</div>
    </div>
    
    <div class="field">
      <div class="label">Access Token（長效 60 天）</div>
      <div class="value">${longToken.access_token}</div>
    </div>
    
    <div class="field">
      <div class="label">Token 過期時間</div>
      <div class="value">${longToken.expires_in ? Math.round(longToken.expires_in / 86400) + ' 天' : 'N/A'}</div>
    </div>
    
    <div class="note">
      ⚠️ 請複製上方的 Access Token，貼給 Bing，他會幫你設定到系統中。
      <br>Token 有效期約 60 天，到期前系統會自動續期。
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: '授權失敗', message: e.message }, { status: 500 })
  }
}
