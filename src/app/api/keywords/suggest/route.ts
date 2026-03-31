import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import OpenAI from 'openai'

const SETTINGS_PATH = path.join(process.cwd(), 'src/data/settings.json')

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; model: string; keyField: string; envKey: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyField: 'openaiKey', envKey: 'OPENAI_API_KEY' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash', keyField: 'googleKey', envKey: 'GOOGLE_AI_API_KEY' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', keyField: 'zhipuKey', envKey: 'ZHIPU_API_KEY' },
}

const HARDCODED_SUGGESTIONS: Record<string, { keyword: string; reason: string }[]> = {
  default: [
    { keyword: '酷澎推薦', reason: 'Coupang 推薦類貼文，高轉換率關鍵字' },
    { keyword: '韓國好物', reason: '韓國商品相關討論，適合推廣韓國商品' },
    { keyword: '省錢推薦', reason: '省錢相關話題，容易帶入分潤連結' },
    { keyword: '酷澎開箱', reason: '開箱文互動率高，適合推廣' },
    { keyword: '韓國零食推薦', reason: '零食是熱門品類，搜尋量大' },
    { keyword: '尿布推薦', reason: '家庭用品剛需，回購率高' },
    { keyword: '韓國美妝', reason: '美妝品類討論度熱絡' },
    { keyword: '酷澎退貨', reason: '可回覆解決問題並推薦其他好物' },
    { keyword: '韓國代購', reason: '代購話題可引導至酷澎直購' },
    { keyword: '好物分享', reason: '通用分享文，容易自然帶入推薦' },
  ],
  零食: [
    { keyword: '韓國零食推薦', reason: '直接相關的零食推薦文' },
    { keyword: '韓國泡麵', reason: '韓國泡麵是熱門零食品項' },
    { keyword: '零食開箱', reason: '開箱文互動率高' },
    { keyword: '韓國糖果', reason: '糖果類零食討論' },
    { keyword: '必買零食', reason: '必買清單類貼文轉換率高' },
    { keyword: '酷澎零食', reason: '直接相關酷澎零食購買' },
    { keyword: '韓國餅乾', reason: '餅乾類零食品項' },
    { keyword: '零食團購', reason: '團購話題可引導至酷澎' },
    { keyword: '韓國海苔', reason: '海苔是熱門韓國零食' },
    { keyword: '追劇零食', reason: '追劇零食場景帶入自然' },
  ],
  美妝: [
    { keyword: '韓國美妝推薦', reason: '直接相關美妝推薦' },
    { keyword: '韓國保養品', reason: '保養品是美妝大品類' },
    { keyword: '韓妝開箱', reason: '開箱文互動率高' },
    { keyword: '韓國面膜', reason: '面膜是熱門美妝品項' },
    { keyword: '平價美妝', reason: '平價美妝話題轉換率高' },
    { keyword: '酷澎美妝', reason: '直接相關酷澎美妝購買' },
    { keyword: '韓國氣墊', reason: '氣墊粉餅是韓國美妝代表' },
    { keyword: '美妝好物', reason: '通用美妝分享話題' },
    { keyword: '韓國唇膜', reason: '唇膜是近期熱門品項' },
    { keyword: '保養推薦', reason: '保養推薦文容易帶入連結' },
  ],
}

function getHardcodedSuggestions(productName: string, description: string): { keyword: string; reason: string }[] {
  const text = (productName + ' ' + description).toLowerCase()
  if (text.includes('零食') || text.includes('食品') || text.includes('泡麵')) return HARDCODED_SUGGESTIONS['零食']
  if (text.includes('美妝') || text.includes('保養') || text.includes('化妝')) return HARDCODED_SUGGESTIONS['美妝']
  return HARDCODED_SUGGESTIONS['default']
}

export async function POST(req: NextRequest) {
  try {
    const { productName, description } = await req.json()
    if (!productName) {
      return NextResponse.json({ error: '商品名稱為必填' }, { status: 400 })
    }

    // Read settings to get AI provider config
    let settings: any = {}
    try {
      const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
      settings = JSON.parse(raw)
    } catch { /* use defaults */ }

    const provider = settings.aiProvider || 'zhipu'
    const config = PROVIDER_CONFIGS[provider]
    const apiKey = settings[config?.keyField] || process.env[config?.envKey] || ''

    // If no API key, return hardcoded suggestions
    if (!apiKey || apiKey === 'your-key-here') {
      return NextResponse.json(getHardcodedSuggestions(productName, description || ''))
    }

    // Use AI to generate suggestions
    try {
      const openai = new OpenAI({ apiKey, baseURL: config.baseUrl })
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一個社群媒體行銷專家，擅長為 Threads 平台設計搜尋關鍵字。請用繁體中文回答。只回傳 JSON 陣列，不要加 markdown 格式。',
          },
          {
            role: 'user',
            content: `請為以下商品生成 10 個適合在 Threads 搜尋的關鍵字，每個關鍵字附上簡短理由。
商品名稱：${productName}
商品描述：${description || '優質商品'}

請以 JSON 陣列格式回傳，格式如下：
[{"keyword": "關鍵字", "reason": "理由"}]`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content?.trim() || ''
      // Try to parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        return NextResponse.json(suggestions)
      }
      // Fallback to hardcoded
      return NextResponse.json(getHardcodedSuggestions(productName, description || ''))
    } catch (e) {
      console.error('AI keyword generation failed:', e)
      return NextResponse.json(getHardcodedSuggestions(productName, description || ''))
    }
  } catch {
    return NextResponse.json({ error: '生成建議失敗' }, { status: 500 })
  }
}
