import { get, set } from './store'

const KEY = 'keywords'

export async function getKeywords() {
  return (await get(KEY)) || []
}

export async function addKeyword(keyword: string) {
  const keywords = await getKeywords()
  if (keywords.find((k: any) => k.keyword === keyword)) return null
  const kw = {
    id: `kw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    keyword,
    active: true,
    scanCount: 0,
    createdAt: new Date().toISOString(),
  }
  keywords.push(kw)
  await set(KEY, keywords)
  return kw
}

export async function updateKeyword(id: string, data: any) {
  const keywords = await getKeywords()
  const idx = keywords.findIndex((k: any) => k.id === id)
  if (idx === -1) return null
  keywords[idx] = { ...keywords[idx], ...data }
  await set(KEY, keywords)
  return keywords[idx]
}

export async function deleteKeyword(id: string) {
  const keywords = await getKeywords()
  const filtered = keywords.filter((k: any) => k.id !== id)
  await set(KEY, filtered)
  return filtered.length < keywords.length
}
