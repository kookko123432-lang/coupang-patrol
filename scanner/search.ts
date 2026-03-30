/**
 * Threads Search Scanner
 * 
 * Usage:
 *   npx tsx scanner/search.ts --once    (single run)
 *   npx tsx scanner/search.ts           (continuous mode)
 * 
 * Runs on: Local Mac, GitHub Actions, VPS
 */

import { chromium, type Browser, type BrowserContext } from 'playwright'

const APP_URL = process.env.APP_URL || 'https://coupang-patrol.vercel.app'
const SCAN_INTERVAL_MS = 15 * 60 * 1000
const KEYWORDS = process.env.KEYWORDS?.split(',').map(k => k.trim()) || [
  '酷澎推薦', '尿布推薦', '韓國零食', 'Coupang', '酷澎', '韓國美妝', '省錢好物'
]
const MAX_RESULTS = 10

interface ScannedPost {
  threadsPostId: string
  authorName: string
  content: string
  likeCount: number
  replyCount: number
  keyword: string
  url: string
}

async function searchKeyword(context: BrowserContext, keyword: string): Promise<ScannedPost[]> {
  const results: ScannedPost[] = []
  const page = await context.newPage()

  try {
    const url = `https://www.threads.net/search?q=${encodeURIComponent(keyword)}`
    console.log(`🔍 [${keyword}] Searching...`)

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(3000)

    // Scroll to load more content
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(1000 + Math.random() * 500)
    }

    // Extract posts from the page
    const rawPosts = await page.evaluate(() => {
      const items: Array<{
        text: string
        username: string
        postId: string
        likes: number
      }> = []

      // Grab all visible content blocks
      const allText = document.querySelectorAll('span[dir="auto"]')
      const allLinks = document.querySelectorAll('a[href*="/post/"]')

      // Build a map of postId -> link
      const postLinks = new Map<string, string>()
      allLinks.forEach((a: HTMLAnchorElement) => {
        const match = a.href.match(/\/post\/([^?/]+)/)
        if (match) postLinks.set(match[1], a.href)
      })

      // Try to get structured data
      const articles = document.querySelectorAll('article, [role="article"], [data-pressable-container]')
      
      if (articles.length > 0) {
        articles.forEach(article => {
          try {
            const spans = article.querySelectorAll('span[dir="auto"]')
            let fullText = ''
            spans.forEach(s => { if (s.textContent) fullText += s.textContent + ' ' })
            fullText = fullText.trim()

            const userMatch = article.innerHTML.match(/href="\/@([^"]+)"/)
            const postMatch = article.innerHTML.match(/\/post\/([^"?]+)/)

            if (fullText.length > 20 && postMatch) {
              items.push({
                text: fullText.substring(0, 600),
                username: userMatch?.[1] || '',
                postId: postMatch[1],
                likes: 0,
              })
            }
          } catch {}
        })
      } else {
        // Fallback: just grab postId from links and nearby text
        postLinks.forEach((link, postId) => {
          const el = document.querySelector(`a[href*="/post/${postId}"]`)
          if (el) {
            const parent = el.closest('div')?.parentElement
            const text = parent?.textContent?.trim() || ''
            if (text.length > 20) {
              const userMatch = parent?.innerHTML?.match(/href="\/@([^"]+)"/)
              items.push({
                text: text.substring(0, 600),
                username: userMatch?.[1] || '',
                postId,
                likes: 0,
              })
            }
          }
        })
      }

      return items
    })

    // Deduplicate by postId and add to results
    const seen = new Set<string>()
    for (const post of rawPosts) {
      if (seen.has(post.postId)) continue
      seen.add(post.postId)

      results.push({
        threadsPostId: post.postId,
        authorName: post.username || 'unknown',
        content: post.text,
        likeCount: post.likes || 0,
        replyCount: 0,
        keyword,
        url: `https://www.threads.net/@${post.username}/post/${post.postId}`,
      })

      if (results.length >= MAX_RESULTS) break
    }

    console.log(`  ✅ Found ${results.length} posts`)
  } catch (e: any) {
    console.error(`  ❌ Error: ${e.message.substring(0, 100)}`)
  } finally {
    await page.close().catch(() => {})
  }

  return results
}

async function pushResults(posts: ScannedPost[]) {
  if (posts.length === 0) {
    console.log('  No posts to push')
    return
  }

  try {
    const res = await fetch(`${APP_URL}/api/scan/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    })
    const data = await res.json()
    console.log(`  📤 Pushed ${posts.length} posts → ${JSON.stringify(data)}`)
  } catch (e: any) {
    console.error(`  📤 Push failed: ${e.message}`)
  }
}

async function runScan() {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🚀 Threads Scanner - ${new Date().toISOString()}`)
  console.log(`   Keywords: ${KEYWORDS.join(', ')}`)
  console.log(`   App: ${APP_URL}`)
  console.log(`${'='.repeat(50)}\n`)

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',  // Important for GitHub Actions
      ],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 },
    })

    const allPosts: ScannedPost[] = []

    for (const keyword of KEYWORDS) {
      const posts = await searchKeyword(context, keyword)
      allPosts.push(...posts)
      // Random delay to look more human
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000))
    }

    await context.close()

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n📊 Total: ${allPosts.length} posts in ${elapsed}s`)

    await pushResults(allPosts)

    console.log(`\n✅ Done in ${elapsed}s!\n`)
  } catch (e: any) {
    console.error(`\n❌ Fatal error: ${e.message}\n`)
  } finally {
    await browser?.close().catch(() => {})
  }
}

// Main
async function main() {
  const once = process.argv.includes('--once')
  if (once) {
    await runScan()
    return
  }

  console.log('🔄 Continuous mode — Ctrl+C to stop')
  console.log(`   Interval: ${SCAN_INTERVAL_MS / 60000} min\n`)
  await runScan()
  setInterval(runScan, SCAN_INTERVAL_MS)
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
