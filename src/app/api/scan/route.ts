import { NextResponse } from 'next/server'

export async function GET() {
  // Redirect to ingest endpoint which holds the data
  const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3456'}/api/scan/ingest`)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST() {
  return NextResponse.json({ 
    message: '使用本地掃描器搜尋 Threads 貼文',
    command: 'cd coupang-patrol && npx tsx scanner/search.ts --once',
  })
}
