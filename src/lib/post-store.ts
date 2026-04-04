import { get, set } from './store'

const KEY = 'scanned_posts'

export interface ScanPost {
  id: string
  platform: 'threads' | 'x' | 'twitter'
  platformPostId: string  // threadsPostId or xPostId
  authorName: string
  authorHandle?: string
  content: string
  likeCount: number
  replyCount: number
  repostCount?: number
  keyword: string
  url: string
  scannedAt: string
  status: 'new' | 'replied' | 'skipped'
  productId?: string
  accountId?: string
  reply?: { content: string; status: string }
}

export async function getPosts(): Promise<ScanPost[]> {
  const posts = (await get(KEY)) || []
  return posts.sort((a: ScanPost, b: ScanPost) =>
    new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  )
}

export async function addPosts(posts: any[]): Promise<{ added: number; total: number }> {
  const existing = await getPosts()
  const existingIds = new Set(
    existing.map((p: any) => p.platformPostId || p.threadsPostId)
  )
  let added = 0

  for (const post of posts) {
    const postId = post.platformPostId || post.threadsPostId
    if (!existingIds.has(postId)) {
      existing.push({
        ...post,
        platform: post.platform || 'threads',
        platformPostId: postId,
        // Backward compat: keep threadsPostId
        threadsPostId: post.threadsPostId || postId,
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        scannedAt: post.scannedAt || new Date().toISOString(),
        status: 'new',
      })
      existingIds.add(postId)
      added++
    }
  }

  const toSave = existing.length > 500 ? existing.slice(-500) : existing
  await set(KEY, toSave)
  return { added, total: toSave.length }
}

export async function updatePost(id: string, data: any) {
  const posts = await getPosts()
  const idx = posts.findIndex((p: ScanPost) => p.id === id)
  if (idx === -1) return null
  posts[idx] = { ...posts[idx], ...data }
  await set(KEY, posts)
  return posts[idx]
}
