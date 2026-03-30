import { NextRequest, NextResponse } from 'next/server'

const APP_ID = process.env.THREADS_APP_ID || '1854584565252934'
const APP_SECRET = process.env.THREADS_APP_SECRET || ''
const REDIRECT_URI = process.env.THREADS_REDIRECT_URI || 'https://coupang-patrol.vercel.app/api/auth/callback'

// Step 1: Redirect user to Threads OAuth login
export async function GET(req: NextRequest) {
  const url = new URL('https://www.threads.net/oauth/authorize')
  url.searchParams.set('client_id', APP_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', 'threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies,threads_manage_insights')
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
