import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'src/data/settings.json')

const DEFAULT_SETTINGS = {
  brandTone: 'casual',
  scanInterval: 60,
  autoPublish: false,
  aiProvider: 'zhipu',
  openaiKey: '',
  googleKey: '',
  zhipuKey: '',
  platforms: ['threads'],
  scanEnabled: true,
}

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

async function writeSettings(settings: any) {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const settings = await readSettings()
    // Mask API keys for display
    const masked = { ...settings }
    for (const key of ['openaiKey', 'googleKey', 'zhipuKey']) {
      if (masked[key]) {
        masked[key + 'Set'] = true
        masked[key] = masked[key].slice(0, 4) + '***'
      } else {
        masked[key + 'Set'] = false
      }
    }
    return NextResponse.json(masked)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const current = await readSettings()

    // Merge: only update known fields
    const merged = { ...current }
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (body[key] !== undefined) {
        // Don't overwrite real keys with masked values
        if (['openaiKey', 'googleKey', 'zhipuKey'].includes(key)) {
          if (body[key] && !body[key].includes('***')) {
            merged[key] = body[key]
          }
        } else {
          (merged as any)[key] = body[key]
        }
      }
    }

    await writeSettings(merged)
    return NextResponse.json({ ok: true, ...merged })
  } catch {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}
