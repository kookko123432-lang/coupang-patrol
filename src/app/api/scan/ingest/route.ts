// In-memory store for scanned posts
let scannedPosts: any[] = []

export async function POST(req: Request) {
  try {
    const { posts } = await req.json()
    if (!posts || !Array.isArray(posts)) {
      return Response.json({ error: 'No posts' }, { status: 400 })
    }

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

    if (scannedPosts.length > 500) {
      scannedPosts = scannedPosts.slice(-500)
    }

    return Response.json({ ok: true, received: posts.length, added, total: scannedPosts.length })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return Response.json(scannedPosts)
}
