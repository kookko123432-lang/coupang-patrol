import { get, set } from './store'

const KEY = 'products'

export async function getProducts() {
  return (await get(KEY)) || []
}

export async function addProduct(data: { name: string; description?: string; affiliateUrl: string; category?: string }) {
  const products = await getProducts()
  const product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  }
  products.push(product)
  await set(KEY, products)
  return product
}

export async function updateProduct(id: string, data: any) {
  const products = await getProducts()
  const idx = products.findIndex((p: any) => p.id === id)
  if (idx === -1) return null
  products[idx] = { ...products[idx], ...data }
  await set(KEY, products)
  return products[idx]
}

export async function deleteProduct(id: string) {
  const products = await getProducts()
  const filtered = products.filter((p: any) => p.id !== id)
  await set(KEY, filtered)
  return filtered.length < products.length
}
