import { NextResponse } from 'next/server'
import { getAllActiveKeywords } from '@/lib/product-store'

export async function GET() {
  const keywords = await getAllActiveKeywords()
  // Deduplicate keyword texts
  const uniqueTexts = [...new Set(keywords.map(kw => kw.text))]
  return NextResponse.json({ keywords: uniqueTexts, details: keywords })
}
