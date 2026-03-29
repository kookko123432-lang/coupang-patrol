import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEMO_USER_ID = 'demo_user'

export async function GET() {
  try {
    // In a real app, this would be per-user settings from DB
    // For MVP, return defaults
    return NextResponse.json({
      brandTone: 'casual',
      scanInterval: 15,
      autoPublish: false,
      openaiKeySet: false,
    })
  } catch {
    return NextResponse.json({ brandTone: 'casual', scanInterval: 15, autoPublish: false })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    // In a real app, save to DB. For MVP, just return success.
    return NextResponse.json({ ok: true, ...body })
  } catch {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}
