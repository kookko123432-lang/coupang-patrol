import { get, set } from './store'

const KEY = 'scanned_posts'

export async function getPosts() {
  const posts = (await get(KEY)) || []
  return posts.sort((a: any, b: any) =>
    new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  )
}

export async function addPosts(posts: any[]): Promise<{ added: number; total: number }> {
  const existing = await getPosts()
  const existingIds = new Set(existing.map((p: any) => p.threadsPostId))
  let added = 0

  for (const post of posts) {
    if (!existingIds.has(post.threadsPostId)) {
      existing.push({
        ...post,
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        scannedAt: new Date().toISOString(),
        status: 'new',
      })
      added++
    }
  }

  const toSave = existing.length > 500 ? existing.slice(-500) : existing
  await set(KEY, toSave)
  return { added, total: toSave.length }
}

export async function updatePost(id: string, data: any) {
  const posts = await getPosts()
  const idx = posts.findIndex((p: any) => p.id === id)
  if (idx === -1) return null
  posts[idx] = { ...posts[idx], ...data }
  await set(KEY, posts)
  return posts[idx]
}
