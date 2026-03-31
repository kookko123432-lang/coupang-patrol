import { NextRequest, NextResponse } from 'next/server'
import { getAccounts, addAccount, deleteAccount } from '@/lib/account-store'

export async function GET() {
  const accounts = await getAccounts()

  // If no accounts stored yet but we have a Threads env token, auto-create one
  if (accounts.filter(a => a.platform === 'threads').length === 0 && process.env.THREADS_ACCESS_TOKEN) {
    try {
      const profileRes = await fetch(`https://graph.threads.net/v1.0/26463285206638172?fields=id,username,name&access_token=${process.env.THREADS_ACCESS_TOKEN}`)
      if (profileRes.ok) {
        const profile = await profileRes.json()
        const auto = await addAccount({
          platform: 'threads',
          platformUserId: profile.id,
          username: profile.username,
          name: profile.name,
          connected: true,
        })
        const all = await getAccounts()
        return NextResponse.json({ accounts: all })
      }
    } catch {}
  }

  return NextResponse.json({ accounts })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await deleteAccount(id)
  return NextResponse.json({ ok: true })
}
