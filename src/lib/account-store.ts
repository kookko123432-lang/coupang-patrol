import { get, set } from './store'

const KEY = 'social_accounts'

export interface SocialAccount {
  id: string
  platform: 'threads' | 'twitter' | 'instagram'
  platformUserId: string
  username: string
  name: string
  accessToken?: string
  connected: boolean
  addedAt: string
}

export async function getAccounts(): Promise<SocialAccount[]> {
  return (await get(KEY)) || []
}

export async function getAccountsByPlatform(platform: string): Promise<SocialAccount[]> {
  const accounts = await getAccounts()
  return accounts.filter(a => a.platform === platform)
}

export async function addAccount(account: Omit<SocialAccount, 'id' | 'addedAt'>) {
  const accounts = await getAccounts()
  const newAccount: SocialAccount = {
    ...account,
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
  }
  accounts.push(newAccount)
  await set(KEY, accounts)
  return newAccount
}

export async function updateAccount(id: string, data: Partial<SocialAccount>) {
  const accounts = await getAccounts()
  const idx = accounts.findIndex(a => a.id === id)
  if (idx === -1) return null
  accounts[idx] = { ...accounts[idx], ...data }
  await set(KEY, accounts)
  return accounts[idx]
}

export async function deleteAccount(id: string) {
  const accounts = await getAccounts()
  const filtered = accounts.filter(a => a.id !== id)
  await set(KEY, filtered)
  return filtered.length < accounts.length
}
