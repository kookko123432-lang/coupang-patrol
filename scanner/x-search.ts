/**
 * X (Twitter) Search Scanner via Playwright
 *
 * Scrapes X search results without needing the paid API.
 * Requires auth cookies (stored in env X_AUTH_COOKIES or Redis).
 *
 * Usage:
 *   npx tsx scanner/x-search.ts --once
 */

import { chromium, type Browser, type BrowserContext } from 'playwright'

const APP_URL = process.env.APP_URL || 'https://coupang-patrol.vercel.app'
const MAX_RESULTS = 10

interface XScannedPost {
  xPostId: string
  authorName: string
  authorHandle: string
  content: string
  likeCount: number
  replyCount: number
  repostCount: number
  keyword: string
  url: string
}

// Parse cookies from env var (JSON string or name=value pairs separated by ;)
function parseCookies(envStr: string): Array<{ name: string; value: string; domain: string; path: string }> {
  try {
    // Try JSON format first
    const parsed = JSON.parse(envStr)
    if (Array.isArray(parsed)) return parsed
  } catch {}

  // Try "name1=value1; name2=value2" format
  const cookies: Array<{ name: string; value: string; domain: string; path: string }> = []
  for (const pair of envStr.split(';')) {
    const [name, ...rest] = pair.trim().split('=')
    if (name && rest.length > 0) {
      cookies.push({ name: name.trim(), value: rest.join('=').trim(), domain: '.x.com', path: '/' })
    }
  }
  return cookies
}

// Extract cookies from a logged-in browser session
async function extractCookies(context: BrowserContext): Promise<string> {
  const cookies = await context.cookies(['https://x.com', 'https://twitter.com'])
  // Only keep the essential auth cookies
  const essential = cookies.filter(c =>
    ['auth_token', 'ct0', 'twid', 'kdt'].includes(c.name)
  )
  return JSON.stringify(essential)
}

async function searchX(
  context: BrowserContext,
  keyword: string,
): Promise<XScannedPost[]> {
  const results: XScannedPost[] = []
  const page = await context.newPage()

  try {
    // X search URL with live (latest) filter
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`
    console.log(`  🔍 Searching X: "${keyword}"`)

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(3000)

    // Check if we hit a login wall
    const hasLoginWall = await page.evaluate(() => {
      return !!document.querySelector('input[name="text"]') // login form
        || !!document.querySelector('[data-testid="loginButton"]')
        || window.location.href.includes('login')
    })

    if (hasLoginWall) {
      console.log('  ⚠️ Hit X login wall — need valid auth cookies')
      await page.close()
      return []
    }

    // Scroll to load more tweets
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(800 + Math.random() * 500)
    }

    // Extract tweets from the page
    const rawTweets = await page.evaluate(() => {
      const tweets: Array<{
        text: string
        username: string
        handle: string
        postId: string
        likes: number
        replies: number
        reposts: number
      }> = []

      // X uses data-testid attributes for tweet cells
      const tweetCells = document.querySelectorAll('[data-testid="tweet"]')
      const seen = new Set<string>()

      tweetCells.forEach(cell => {
        try {
          // Get post link (contains the tweet ID)
          const timeEl = cell.querySelector('time')
          const linkEl = timeEl?.closest('a')
          const href = linkEl?.getAttribute('href') || ''
          const postMatch = href.match(/\/status\/(\d+)/)
          if (!postMatch || seen.has(postMatch[1])) return
          seen.add(postMatch[1])

          // Get tweet text
          const textEl = cell.querySelector('[data-testid="tweetText"]')
          const text = textEl?.textContent?.trim() || ''

          // Get author
          const userLinks = cell.querySelectorAll('a[href^="/"]')
          let handle = ''
          let username = ''
          userLinks.forEach((a: Element) => {
            const h = a.getAttribute('href') || ''
            const handleMatch = h.match(/^\/([^/]+)\/status/)
            if (handleMatch) {
              handle = handleMatch[1]
              username = a.textContent?.trim() || ''
            }
          })

          // If we didn't get handle from status link, try user link
          if (!handle) {
            const userLink = cell.querySelector('[data-testid="User-Name"] a')
            if (userLink) {
              const h = userLink.getAttribute('href') || ''
              handle = h.replace(/^\//, '')
              username = userLink.textContent?.trim() || ''
            }
          }

          // Get engagement counts
          const getCount = (testId: string): number => {
            const el = cell.querySelector(`[data-testid="${testId}"]`)
            if (!el) return 0
            const text = el.textContent || ''
            const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
            if (text.includes('K')) return num * 1000
            if (text.includes('M')) return num * 1000000
            return isNaN(num) ? 0 : num
          }

          if (text.length > 10) {
            tweets.push({
              text: text.substring(0, 1000),
              username,
              handle,
              postId: postMatch[1],
              likes: getCount('like'),
              replies: getCount('reply'),
              reposts: getCount('retweet'),
            })
          }
        } catch {}
      })

      return tweets
    })

    for (const tweet of rawTweets) {
      results.push({
        xPostId: tweet.postId,
        authorName: tweet.username || tweet.handle,
        authorHandle: tweet.handle,
        content: tweet.text,
        likeCount: tweet.likes,
        replyCount: tweet.replies,
        repostCount: tweet.reposts,
        keyword,
        url: `https://x.com/${tweet.handle}/status/${tweet.postId}`,
      })
      if (results.length >= MAX_RESULTS) break
    }

    console.log(`  ✅ Found ${results.length} tweets for "${keyword}"`)
  } catch (e: any) {
    console.error(`  ❌ X search error: ${e.message.substring(0, 100)}`)
  } finally {
    await page.close().catch(() => {})
  }

  return results
}

async function pushResults(posts: XScannedPost[]) {
  if (posts.length === 0) return

  try {
    const res = await fetch(`${APP_URL}/api/scan/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posts: posts.map(p => ({
          platform: 'x',
          platformPostId: p.xPostId,
          authorName: p.authorName,
          authorHandle: p.authorHandle,
          content: p.content,
          likeCount: p.likeCount,
          replyCount: p.replyCount,
          repostCount: p.repostCount,
          keyword: p.keyword,
          url: p.url,
        })),
      }),
    })
    const data = await res.json()
    console.log(`  📤 Pushed ${posts.length} X posts → ${JSON.stringify(data)}`)
  } catch (e: any) {
    console.error(`  📤 Push failed: ${e.message}`)
  }
}

async function runScan(keywords: string[]) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🐦 X (Twitter) Scanner - ${new Date().toISOString()}`)
  console.log(`   Keywords: ${keywords.join(', ')}`)
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

    // Add auth cookies if available
    const cookieStr = process.env.X_AUTH_COOKIES
    if (cookieStr) {
      const cookies = parseCookies(cookieStr)
      if (cookies.length > 0) {
        await context.addCookies(cookies)
        console.log(`  🍪 Loaded ${cookies.length} auth cookies`)
      }
    } else {
      console.log('  ⚠️ No X_AUTH_COOKIES set — may hit login wall')
    }

    // First visit x.com to establish session
    const setupPage = await context.newPage()
    await setupPage.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 20000 })
    await setupPage.waitForTimeout(2000)

    // Check if logged in
    const isLoggedIn = await setupPage.evaluate(() => {
      return !document.querySelector('input[name="text"]')
        && !document.querySelector('[data-testid="loginButton"]')
    })
    console.log(`  ${isLoggedIn ? '✅ Logged in to X' : '❌ Not logged in — search will be limited'}`)
    await setupPage.close()

    if (!isLoggedIn && !cookieStr) {
      console.log('  ⏭️ Skipping X scan — no auth cookies and not logged in')
      await context.close()
      return
    }

    const allPosts: XScannedPost[] = []

    for (const keyword of keywords) {
      const posts = await searchX(context, keyword)
      allPosts.push(...posts)
      // Random delay between keywords
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000))
    }

    await context.close()

    console.log(`\n📊 X Total: ${allPosts.length} tweets`)
    await pushResults(allPosts)
    console.log(`\n✅ X scan done!\n`)
  } catch (e: any) {
    console.error(`\n❌ X scan error: ${e.message}\n`)
  } finally {
    await browser?.close().catch(() => {})
  }
}

// Main
const keywords = process.env.KEYWORDS?.split(',').map(k => k.trim()).filter(Boolean) || []

if (keywords.length === 0) {
  console.log('⚠️ No keywords — set KEYWORDS env var')
  process.exit(0)
}

runScan(keywords).catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
