// Shared in-memory store for products
// In production SaaS, replace with Vercel Postgres

let products: any[] = []

export function getProducts() {
  return products
}

export function addProduct(data: { name: string; description?: string; affiliateUrl: string; category?: string }) {
  const product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  }
  products.push(product)
  return product
}

export function updateProduct(id: string, data: any) {
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return null
  products[idx] = { ...products[idx], ...data }
  return products[idx]
}

export function deleteProduct(id: string) {
  const idx = products.findIndex(p => p.id === id)
  if (idx === -1) return false
  products.splice(idx, 1)
  return true
}
