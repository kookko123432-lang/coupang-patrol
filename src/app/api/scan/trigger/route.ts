import { NextResponse } from 'next/server'

const OWNER = 'kookko123432-lang'
const REPO = 'coupang-patrol'
const WORKFLOW_ID = 'scan.yml'

export async function POST() {
  const token = process.env.GH_PAT || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || ''

  if (!token) {
    return NextResponse.json(
      { ok: false, error: '未設定 GH_PAT 環境變數，無法觸發掃描' },
      { status: 400 }
    )
  }

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'coupang-patrol',
      },
      body: JSON.stringify({ ref: 'main' }),
    })

    if (res.ok || res.status === 204) {
      return NextResponse.json({ ok: true, message: '掃描已觸發' })
    }

    const err = await res.text()
    console.error('GitHub API error:', res.status, err)
    return NextResponse.json(
      { ok: false, error: `GitHub API 回應錯誤 (${res.status})` },
      { status: 502 }
    )
  } catch (e: any) {
    console.error('Trigger scan failed:', e)
    return NextResponse.json(
      { ok: false, error: `觸發失敗：${e.message}` },
      { status: 500 }
    )
  }
}
