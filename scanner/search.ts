/**
 * Threads Search Scanner
 * 
 * Usage:
 *   npx tsx scanner/search.ts --once    (single run)
 *   npx tsx scanner/search.ts           (continuous mode)
 * 
 * Runs on: Local Mac, GitHub Actions, VPS
 */

import { chromium, type Browser, type BrowserContext, type Response } from 'playwright'

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

// Map shortcodes to media IDs captured from API responses
const shortcodeToMediaId = new Map<string, string>()

function extractMediaIdsFromResponse(response: Response) {
  try {
    const url = response.url()
    // Threads uses GraphQL or REST APIs that return post data with media IDs
    if (!url.includes('graphql') && !url.includes('api') && !url.includes('v1.0')) return
    
    // We'll process the body in the searchKeyword function via page.evaluate
  } catch {}
}

async function searchKeyword(context: BrowserContext, keyword: string): Promise<ScannedPost[]> {
  const results: ScannedPost[] = []
  const page = await context.newPage()

  // Intercept API responses to capture media IDs
  const capturedMediaIds: Map<string, string> = new Map()
  page.on('response', async (response) => {
    try {
      const url = response.url()
      const contentType = response.headers()['content-type'] || ''
      if (!contentType.includes('json')) return
      
      const text = await response.text().catch(() => '')
      if (!text || text.length < 100) return
      
      // Log what API endpoints Threads uses (for debugging)
      if (text.includes('shortcode') || text.includes('"code"')) {
        console.log(`    🔗 API: ${url.substring(0, 80)}... (${text.length} bytes)`)
      }
      
      // Strategy 1: Look for "code":"SHORTCODE" paired with "pk":"MEDIA_ID"
      // These can appear in any order within the same JSON block
      const allCodeMatches = [...text.matchAll(/"code"\s*:\s*"([^"]{8,15})"/g)]
      const allPkMatches = [...text.matchAll(/"pk"\s*:\s*"?(\d{17,20})"?/g)]
      
      if (allCodeMatches.length > 0 && allPkMatches.length > 0) {
        // Pair them by proximity
        for (const codeMatch of allCodeMatches) {
          const code = codeMatch[1]
          // Find closest pk
          let closestPk = null
          let closestDist = Infinity
          for (const pkMatch of allPkMatches) {
            const dist = Math.abs((codeMatch.index || 0) - (pkMatch.index || 0))
            if (dist < closestDist && dist < 2000) {
              closestDist = dist
              closestPk = pkMatch[1]
            }
          }
          if (closestPk) {
            capturedMediaIds.set(code, closestPk)
          }
        }
      }
      
      // Strategy 2: Look for shortcode in URL patterns near media IDs
      // e.g. "permalink":"/@user/post/SHORTCODE" near "id":"MEDIA_ID"
      const permalinkMatches = [...text.matchAll(/\/post\/([^"?\/\s]{8,15})/g)]
      for (const pm of permalinkMatches) {
        const shortcode = pm[1]
        const nearby = text.substring(Math.max(0, pm.index! - 1000), pm.index! + 1000)
        const idMatch = nearby.match(/"id"\s*:\s*"?(\d{17,20})"?/)
        if (idMatch) {
          capturedMediaIds.set(shortcode, idMatch[1])
        }
      }
    } catch {}
  })

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

      const articles = document.querySelectorAll('article, [role="article"], [data-pressable-container]')
      
      if (articles.length > 0) {
        articles.forEach(article => {
          try {
            const spans = article.querySelectorAll('span[dir="auto"]')
            let fullText = ''
            spans.forEach((s: Element) => { if (s.textContent) fullText += s.textContent + ' ' })
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
      }

      // Fallback
      if (items.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/post/"]')
        const postLinks = new Map<string, string>()
        allLinks.forEach((el) => {
          const a = el as HTMLAnchorElement
          const match = a.href.match(/\/post\/([^?/]+)/)
          if (match) postLinks.set(match[1], a.href)
        })
        postLinks.forEach((link, postId) => {
          const el = document.querySelector(`a[href*="/post/${postId}"]`)
          if (el) {
            const parent = el.closest('div')?.parentElement
            const text = parent?.textContent?.trim() || ''
            if (text.length > 20) {
              const userMatch = parent?.innerHTML.match(/href="\/@([^"]+)"/)
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

      // Use captured media ID if available, otherwise use shortcode
      const mediaId = capturedMediaIds.get(post.postId) || post.postId

      results.push({
        threadsPostId: mediaId,
        authorName: post.username || 'unknown',
        content: post.text,
        likeCount: post.likes || 0,
        replyCount: 0,
        keyword,
        url: `https://www.threads.net/@${post.username}/post/${post.postId}`,
      })

      if (results.length >= MAX_RESULTS) break
    }

    console.log(`  ✅ Found ${results.length} posts (${capturedMediaIds.size} media IDs captured)`)
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
        '--disable-dev-shm-usage',
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
