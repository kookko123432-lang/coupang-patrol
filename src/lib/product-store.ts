import { get, set } from './store'

const KEY = 'products'

export interface ProductKeyword {
  id: string
  text: string
  scanEnabled: boolean
  scanInterval: number // minutes: 60, 120, 360, 720, 1440
  autoReply: boolean
}

export interface Product {
  id: string
  name: string
  description: string
  affiliateUrl: string
  category: string
  active: boolean
  keywords: ProductKeyword[]
  accountId?: string
  createdAt: string
}

export async function getProducts(): Promise<Product[]> {
  const raw = (await get(KEY)) || []
  // Ensure every product has keywords array (migration from old format)
  return raw.map((p: any) => ({
    ...p,
    keywords: p.keywords || [],
  }))
}

export async function addProduct(data: { name: string; description?: string; affiliateUrl: string; category?: string; accountId?: string }) {
  const products = await getProducts()
  const product: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: data.name,
    description: data.description || '',
    affiliateUrl: data.affiliateUrl,
    category: data.category || '',
    active: true,
    keywords: [],
    accountId: data.accountId,
    createdAt: new Date().toISOString(),
  }
  products.push(product)
  await set(KEY, products)
  return product
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const products = await getProducts()
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return null
  products[idx] = { ...products[idx], ...data }
  await set(KEY, products)
  return products[idx]
}

export async function deleteProduct(id: string) {
  const products = await getProducts()
  const filtered = products.filter(p => p.id !== id)
  await set(KEY, filtered)
  return filtered.length < products.length
}

// Keyword operations within a product
export async function addKeyword(productId: string, text: string) {
  const products = await getProducts()
  const product = products.find(p => p.id === productId)
  if (!product) return null
  if (product.keywords.find(k => k.text === text)) return null // duplicate

  const keyword: ProductKeyword = {
    id: `kw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    scanEnabled: true,
    scanInterval: 60,
    autoReply: false,
  }
  product.keywords.push(keyword)
  await set(KEY, products)
  return keyword
}

export async function updateKeyword(productId: string, keywordId: string, data: Partial<ProductKeyword>) {
  const products = await getProducts()
  const product = products.find(p => p.id === productId)
  if (!product) return null
  const kwIdx = product.keywords.findIndex(k => k.id === keywordId)
  if (kwIdx === -1) return null
  product.keywords[kwIdx] = { ...product.keywords[kwIdx], ...data }
  await set(KEY, products)
  return product.keywords[kwIdx]
}

export async function deleteKeyword(productId: string, keywordId: string) {
  const products = await getProducts()
  const product = products.find(p => p.id === productId)
  if (!product) return false
  product.keywords = product.keywords.filter(k => k.id !== keywordId)
  await set(KEY, products)
  return true
}

// Get all active keywords across all products (for scanner)
export async function getAllActiveKeywords(): Promise<(ProductKeyword & { productId: string; productName: string; affiliateUrl: string })[]> {
  const products = await getProducts()
  const result: any[] = []
  for (const p of products) {
    if (!p.active) continue
    for (const kw of p.keywords) {
      if (kw.scanEnabled) {
        result.push({ ...kw, productId: p.id, productName: p.name, affiliateUrl: p.affiliateUrl })
      }
    }
  }
  return result
}
