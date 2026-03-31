// Shared in-memory store for keywords

let keywords: any[] = []

export function getKeywords() {
  return keywords
}

export function addKeyword(keyword: string) {
  if (keywords.find(k => k.keyword === keyword)) return null
  const kw = {
    id: `kw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    keyword,
    active: true,
    scanCount: 0,
    createdAt: new Date().toISOString(),
  }
  keywords.push(kw)
  return kw
}

export function updateKeyword(id: string, data: any) {
  const idx = keywords.findIndex(k => k.id === id)
  if (idx === -1) return null
  keywords[idx] = { ...keywords[idx], ...data }
  return keywords[idx]
}

export function deleteKeyword(id: string) {
  const idx = keywords.findIndex(k => k.id === id)
  if (idx === -1) return false
  keywords.splice(idx, 1)
  return true
}
