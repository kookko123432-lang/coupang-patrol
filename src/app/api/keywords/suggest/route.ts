import { NextRequest, NextResponse } from 'next/server'

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; model: string; envKey: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', envKey: 'OPENAI_API_KEY' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', envKey: 'GOOGLE_AI_API_KEY' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', envKey: 'ZHIPU_API_KEY' },
}

const FALLBACK: Record<string, string[]> = {
  default: ['酷澎推薦', '韓國好物', '省錢推薦', '酷澎開箱', '韓國零食推薦', '尿布推薦', '韓國美妝', '韓國代購', '好物分享', '必買清單'],
  尿布: ['尿布推薦', '紙尿褲推薦', '寶寶尿布', '夜間尿布', '尿布比較', '尿布開箱', '新生兒尿布', '尿布團購', '省錢尿布', '酷澎尿布'],
  零食: ['韓國零食推薦', '韓國泡麵', '零食開箱', '必買零食', '酷澎零食', '韓國糖果', '韓國餅乾', '追劇零食', '韓國海苔', '零食團購'],
  美妝: ['韓國美妝推薦', '韓國保養品', '韓妝開箱', '韓國面膜', '平價美妝', '酷澎美妝', '韓國氣墊', '美妝好物', '保養推薦', '韓國唇膜'],
}

function getFallback(name: string, desc: string): string[] {
  const t = (name + ' ' + desc).toLowerCase()
  if (t.includes('尿布') || t.includes('紙尿褲')) return FALLBACK['尿布']
  if (t.includes('零食') || t.includes('食品') || t.includes('泡麵')) return FALLBACK['零食']
  if (t.includes('美妝') || t.includes('保養') || t.includes('化妝')) return FALLBACK['美妝']
  return FALLBACK['default']
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = body.name || body.productName || ''
    const desc = body.description || ''
    const category = body.category || ''

    if (!name) return NextResponse.json({ keywords: getFallback(name, desc) })

    // Try to read AI key from settings store
    let apiKey = ''
    let provider = 'zhipu'
    try {
      const { get } = await import('@/lib/store')
      const settings: any = await get('settings')
      if (settings) {
        provider = settings.aiProvider || 'zhipu'
        apiKey = settings[`${provider}Key`] || ''
      }
    } catch {}

    // Also check env vars
    const config = PROVIDER_CONFIGS[provider]
    if (!apiKey && config) {
      apiKey = process.env[config.envKey] || ''
    }

    // No API key → return fallback
    if (!apiKey) {
      return NextResponse.json({ keywords: getFallback(name, desc) })
    }

    // Use AI
    try {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey, baseURL: config.baseUrl })
      const res = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: '你是 Threads 行銷專家。只回傳 JSON 陣列，不要 markdown。' },
          { role: 'user', content: `為此商品生成 10 個 Threads 搜尋關鍵字（繁體中文）。只回傳字串陣列格式：["關鍵字1","關鍵字2",...]\n\n商品：${name}\n分類：${category}\n描述：${desc}` },
        ],
        max_tokens: 500,
        temperature: 0.7,
      })

      const content = res.choices[0]?.message?.content?.trim() || ''
      const match = content.match(/\[[\s\S]*\]/)
      if (match) {
        const keywords = JSON.parse(match[0])
        return NextResponse.json({ keywords })
      }
    } catch (e) {
      console.error('AI suggest failed:', e)
    }

    return NextResponse.json({ keywords: getFallback(name, desc) })
  } catch {
    return NextResponse.json({ keywords: FALLBACK['default'] })
  }
}
