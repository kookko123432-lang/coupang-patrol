import OpenAI from 'openai'

const PROMPT_TEMPLATE = `你是一個社群媒體行銷助手。你的任務是根據目標貼文內容，生成一段自然、有價值的回覆留言。

品牌語氣：{brand_tone}
推廣商品：{product_name} - {product_description}
分潤連結：{affiliate_url}

目標貼文：
作者：{author}
內容：{post_content}

要求：
1. 先針對貼文內容給出有價值的回應（不要一開始就推銷）
2. 自然地帶入產品推薦
3. 語氣要像真人在 Threads 上聊天，不要太正式
4. 留言長度 50-150 字
5. 在結尾附上連結
6. 不要用「#」標籤或 @標記
7. 繁體中文`

const TONE_MAP: Record<string, string> = {
  casual: '輕鬆友善，像朋友聊天',
  professional: '專業但有親和力',
  funny: '幽默風趣，偶爾用emoji',
  expert: '專家口吻，提供深入見解',
}

export type AIProvider = 'openai' | 'google' | 'zhipu'

interface GenerateReplyParams {
  postContent: string
  authorName: string
  brandTone: string
  productName: string
  productDescription: string
  affiliateUrl: string
  provider?: AIProvider
  apiKey?: string
  baseUrl?: string
  model?: string
}

const FALLBACK_TEMPLATES = [
  (p: GenerateReplyParams) =>
    `哈囉！我之前也有類似的需求，後來發現 ${p.productName} 還滿不錯的！${p.productDescription || ''} 可以參考看看，我都是透過酷澎買的，出貨超快 ${p.affiliateUrl}`,

  (p: GenerateReplyParams) =>
    `推一個！最近剛好在用 ${p.productName}，真的覺得CP值很高。${p.productDescription || '品質很不錯'}～有需要可以看看這邊 ${p.affiliateUrl}`,

  (p: GenerateReplyParams) =>
    `同感+1！後來我改用 ${p.productName}，效果真的有差。${p.productDescription || ''} 之前在酷澎買的，隔天就到了超方便 ${p.affiliateUrl}`,
]

// Provider-specific configurations
const PROVIDER_CONFIGS: Record<AIProvider, { baseUrl: string; model: string; envKey: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    envKey: 'GOOGLE_AI_API_KEY',
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    envKey: 'ZHIPU_API_KEY',
  },
}

export async function generateAIReply(params: GenerateReplyParams): Promise<string> {
  const provider = params.provider || 'openai'
  const config = PROVIDER_CONFIGS[provider]
  const apiKey = params.apiKey || process.env[config.envKey] || ''

  if (apiKey && apiKey !== 'your-key-here' && apiKey !== '') {
    try {
      return await generateWithProvider(params, apiKey, config)
    } catch (e) {
      console.error(`AI generation failed with ${provider}:`, e)
      return generateWithTemplate(params)
    }
  }

  return generateWithTemplate(params)
}

async function generateWithProvider(
  params: GenerateReplyParams,
  apiKey: string,
  config: { baseUrl: string; model: string }
): Promise<string> {
  const openai = new OpenAI({
    apiKey,
    baseURL: params.baseUrl || config.baseUrl,
  })

  const prompt = PROMPT_TEMPLATE
    .replace('{brand_tone}', TONE_MAP[params.brandTone] || params.brandTone)
    .replace('{product_name}', params.productName)
    .replace('{product_description}', params.productDescription || '優質商品')
    .replace('{affiliate_url}', params.affiliateUrl)
    .replace('{author}', params.authorName)
    .replace('{post_content}', params.postContent)

  const response = await openai.chat.completions.create({
    model: params.model || config.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.8,
  })

  return response.choices[0]?.message?.content?.trim() || generateWithTemplate(params)
}

function generateWithTemplate(params: GenerateReplyParams): string {
  const templateFn = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)]
  return templateFn(params)
}

export function getProviderInfo(provider: AIProvider) {
  return PROVIDER_CONFIGS[provider]
}

export const AVAILABLE_PROVIDERS: { id: AIProvider; name: string; description: string }[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o-mini，穩定可靠' },
  { id: 'google', name: 'Google Gemini', description: 'Gemini 2.0 Flash，速度快成本低' },
  { id: 'zhipu', name: '智譜 AI (GLM)', description: 'GLM-4 Flash，中文能力強' },
]
