/**
 * Threads Search Scanner - Uses Playwright to search Threads for relevant posts
 * 
 * Usage:
 *   npx tsx scanner/search.ts --once
 *   npx tsx scanner/search.ts  (continuous mode, every 15 min)
 */

import { chromium, type Browser, type Page } from 'playwright'

const APP_URL = process.env.APP_URL || 'https://coupang-patrol.vercel.app'
const SCAN_INTERVAL_MS = 15 * 60 * 1000
const KEYWORDS = process.env.KEYWORDS?.split(',') || ['酷澎推薦', '尿布推薦', '韓國零食', 'Coupang', '酷澎']
const MAX_RESULTS_PER_KEYWORD = 10

interface ScannedPost {
  threadsPostId: string
  authorName: string
  content: string
  likeCount: number
  replyCount: number
  keyword: string
  url: string
}

async function searchKeyword(page: Page, keyword: string): Promise<ScannedPost[]> {
  const results: ScannedPost[] = []
  
  try {
    const searchUrl = `https://www.threads.net/search?q=${encodeURIComponent(keyword)}`
    console.log(`🔍 Searching: "${keyword}"`)
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(4000)

    // Scroll to load more
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(1200)
    }

    // Extract post data
    const posts = await page.evaluate(() => {
      const items: any[] = []
      
      // Try multiple selectors for posts
      const selectors = [
        'div[data-pressable-container="true"]',
        'article',
        '[role="main"] [tabindex]',
      ]
      
      let elements: Element[] = []
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel)
        if (found.length > elements.length) elements = Array.from(found)
      }
      
      elements.forEach((el) => {
        try {
          const text = el.textContent?.trim() || ''
          
          // Extract username
          const usernameMatch = el.innerHTML?.match(/href="\/@([^"]+)"/)
          const username = usernameMatch ? usernameMatch[1] : ''
          
          // Extract post link
          const postMatch = el.innerHTML?.match(/href="[^"]*\/post\/([^"?]+)/)
          const postId = postMatch ? postMatch[1] : ''
          
          // Extract likes
          const likeMatch = el.innerHTML?.match(/(\d[\d,]*)\s*[Ll]ike/)
          const likes = likeMatch ? parseInt(likeMatch[1].replace(/,/g, '')) : 0
          
          if (text.length > 15 && text.length < 2000 && postId) {
            items.push({ text: text.substring(0, 500), username, likes, postId })
          }
        } catch {}
      })
      
      return items
    })

    for (const post of posts.slice(0, MAX_RESULTS_PER_KEYWORD)) {
      results.push({
        threadsPostId: post.postId,
        authorName: post.username || 'unknown',
        content: post.text,
        likeCount: post.likes || 0,
        replyCount: 0,
        keyword,
        url: `https://www.threads.net/@${post.username}/post/${post.postId}`,
      })
    }

    console.log(`  Found ${results.length} posts for "${keyword}"`)
  } catch (e: any) {
    console.error(`  Error searching "${keyword}": ${e.message}`)
  }
  
  return results
}

async function pushResults(posts: ScannedPost[]) {
  if (posts.length === 0) return
  try {
    const res = await fetch(`${APP_URL}/api/scan/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    })
    const data = await res.json()
    console.log(`  Pushed to app: ${JSON.stringify(data)}`)
  } catch (e: any) {
    console.error(`  Failed to push: ${e.message}`)
  }
}

async function runScan() {
  console.log(`\n🚀 Scan started at ${new Date().toISOString()}`)
  console.log(`   Keywords: ${KEYWORDS.join(', ')}\n`)

  let browser: Browser | null = null
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })

    const page = await context.newPage()
    const allPosts: ScannedPost[] = []
    
    for (const keyword of KEYWORDS) {
      const posts = await searchKeyword(page, keyword)
      allPosts.push(...posts)
      await page.waitForTimeout(3000 + Math.random() * 2000)
    }

    await page.close()
    await context.close()

    console.log(`\n📊 Total: ${allPosts.length} posts`)
    await pushResults(allPosts)
    console.log('✅ Done!\n')
  } catch (e: any) {
    console.error('❌ Scan failed:', e.message)
  } finally {
    await browser?.close()
  }
}

async function main() {
  const once = process.argv.includes('--once')
  if (once) {
    await runScan()
    return
  }

  console.log('🔄 Continuous mode (Ctrl+C to stop)')
  console.log(`   Interval: ${SCAN_INTERVAL_MS / 60000} min\n`)
  await runScan()
  setInterval(runScan, SCAN_INTERVAL_MS)
}

main().catch(console.error)
