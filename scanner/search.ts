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

    // Extract posts from the page - including media IDs from React internals
    const rawPosts = await page.evaluate(() => {
      const items: Array<{
        text: string
        username: string
        postId: string
        mediaId: string
        likes: number
      }> = []

    // Strategy: Look at ALL elements with post links, then walk up to find the nearest
      // element that also contains a long numeric ID (the Threads media ID)
      const postLinks = document.querySelectorAll('a[href*="/post/"]')
      const seen = new Set<string>()
      
      postLinks.forEach(link => {
        const a = link as HTMLAnchorElement
        const href = a.getAttribute('href') || ''
        const postMatch = href.match(/\/post\/([^?/]+)/)
        if (!postMatch || seen.has(postMatch[1])) return
        seen.add(postMatch[1])
        const shortcode = postMatch[1]
        
        // Walk up the DOM to find a parent containing both the post content and any data attributes with long IDs
        let el: HTMLElement | null = link
        let mediaId = ''
        let text = ''
        let username = ''
        
        for (let i = 0; i < 15 && el; i++) {
          el = el.parentElement
          if (!el) break
          
          // Try to find media ID in data attributes or aria attributes
          const attrs = el.attributes
          for (let j = 0; j < attrs.length; j++) {
            const val = attrs[j].value
            const numMatch = val.match(/^\d{17,20}$/)
            if (numMatch) {
              mediaId = numMatch[1]
            }
          }
          
          // Get text content from this level
          if (!text && el.textContent && el.textContent.length > 20) {
            text = el.textContent.trim().substring(0, 600)
          }
          
          // Get username
          if (!username) {
            const userEl = el.querySelector('a[href^="/@"]')
            if (userEl) {
              const m = userEl.getAttribute('href')?.match(/^\/@([^/]+)/)
              if (m) username = m[1]
            }
          }
        }
        
        if (text.length > 20) {
          items.push({
            text,
            username,
            postId: shortcode,
            mediaId,
            likes: 0,
          })
        }
      })

    // Strategy 3: Look for __NEXT_DATA__ or similar script tags with embedded data
    const scripts = document.querySelectorAll('script[type="application/json"], script:notmodule]')
    const jsonBlocks: string[] = []
    scripts.forEach(script => {
      try {
        const text = script.textContent
        // Look for shortcodes near long IDs patterns
        const shortcodeMatches = [...text.matchAll(/"code"\s*:\s*"([A-Za-z0-9_]{8,15})"/g)]
        const idMatches = [...text.matchAll(/"(?:media_id|pk|id)"\s*:\s*"?(\d{17,20})"?/g)]
        
        for (const sc of shortcodeMatches) {
          const scText = sc[1]
          for (const id of idMatches) {
            capturedMediaIds.set(scText, id[1])
          }
        }
      } catch {}
    })

      // If the above didn't work, try the old article-based approach
      if (items.length === 0) {
        const articles = document.querySelectorAll('article, [role="article"], [data-pressable-container]')
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
                mediaId: '',
                likes: 0,
              })
            }
          } catch {}
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
      const mediaId = capturedMediaIds.get(post.postId) || post.mediaId || post.postId

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
    // Don't close page yet - we need context for Step 2
    await page.close().catch(() => {})
  }

  // Step 2: For posts without media IDs, visit each post page to extract the media ID
  // from the page's internal data
  const postsNeedingIds = results.filter(p => p.threadsPostId.length < 20)
  if (postsNeedingIds.length > 0) {
    console.log(`  🔗 Resolving media IDs for ${postsNeedingIds.length} posts...`)
    for (const post of postsNeedingIds.slice(0, 15)) { // limit to avoid too many requests
      try {
        const postPage = await context.newPage()
        await postPage.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000 })
        await postPage.waitForTimeout(2000)
        
        // Try to find the media ID in the page
        const pageMediaId = await postPage.evaluate(() => {
          // Check meta tags
          const ogUrl = document.querySelector('meta[property="al:android:url"]')
          if (ogUrl) {
            const content = ogUrl.getAttribute('content') || ''
            const match = content.match(/post\/(\d{17,20})/)
            if (match) return match[1]
          }
          
          // Check all links for numeric post IDs
          const links = document.querySelectorAll('a[href*="/post/"]')
          for (const link of links) {
            const href = link.getAttribute('href') || ''
            const match = href.match(/\/post\/(\d{17,20})/)
            if (match) return match[1]
          }
          
          // Check script tags for embedded data
          const scripts = document.querySelectorAll('script')
          for (const script of scripts) {
            const text = script.textContent || ''
            // Look for "media_id":"NUMBER" or "pk":"NUMBER" patterns
            const mediaMatch = text.match(/"media_id"\s*:\s*"?(\d{17,20})"?/)
            if (mediaMatch) return mediaMatch[1]
            const pkMatch = text.match(/"pk"\s*:\s*"?(\d{17,20})"?/)
            if (pkMatch) return pkMatch[1]
          }
          
          return ''
        })
        
        if (pageMediaId) {
          post.threadsPostId = pageMediaId
          console.log(`    ✅ ${post.url.substring(post.url.lastIndexOf('/'))} → ${pageMediaId}`)
        }
        
        await postPage.close().catch(() => {})
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000))
      } catch {}
    }
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
