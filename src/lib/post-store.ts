// Shared in-memory store for scanned posts
// Both /api/scan and /api/scan/ingest import from here

let scannedPosts: any[] = []

export function getPosts() {
  return scannedPosts.sort((a, b) => 
    new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  )
}

export function addPosts(posts: any[]): { added: number; total: number } {
  const existingIds = new Set(scannedPosts.map(p => p.threadsPostId))
  let added = 0

  for (const post of posts) {
    if (!existingIds.has(post.threadsPostId)) {
      scannedPosts.push({
        ...post,
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        scannedAt: new Date().toISOString(),
        status: 'new',
      })
      added++
    }
  }

  // Keep max 500
  if (scannedPosts.length > 500) {
    scannedPosts = scannedPosts.slice(-500)
  }

  return { added, total: scannedPosts.length }
}
