import Link from 'next/link'
import { Search, MessageSquare, Zap, BarChart3, ArrowRight, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-gray-100">Coupang Patrol</span>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            進入儀表板
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
              <Zap className="w-3.5 h-3.5" />
              AI 驅動的 Threads 海巡系統
            </div>
            <h1 className="text-5xl font-bold text-gray-100 leading-tight mb-6">
              用 AI 自動掃描 Threads
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                智能推廣酷澎商品
              </span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl">
              自動掃描 Threads 上與酷澎相關的討論，AI 生成自然且有價值的推廣留言，
              附上分潤連結，讓你輕鬆賺取推廣收益。
            </p>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold transition-colors"
              >
                開始使用
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-gray-100 rounded-xl text-base font-medium transition-colors"
              >
                了解更多
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-100 text-center mb-4">核心功能</h2>
        <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          從掃描到發布，全流程 AI 協助，讓推廣更輕鬆、更高效
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Search,
              title: '關鍵字海巡',
              desc: '設定監控關鍵字，自動掃描 Threads 上的相關討論貼文，即時掌握話題動態。',
            },
            {
              icon: MessageSquare,
              title: 'AI 文案生成',
              desc: 'AI 根據貼文內容生成自然的推廣留言，語氣可自定義，告別硬廣感。',
            },
            {
              icon: Shield,
              title: '審核管理',
              desc: '手動審核每則 AI 回覆，可編輯修改後再發布，確保內容品質。',
            },
            {
              icon: BarChart3,
              title: '數據分析',
              desc: '追蹤掃描量、回覆率、關鍵字成效，用數據優化推廣策略。',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-800/50">
        <h2 className="text-3xl font-bold text-gray-100 text-center mb-16">運作流程</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: '設定關鍵字 & 商品',
              desc: '輸入想監控的關鍵字（如「酷澎推薦」），並設定推廣商品與分潤連結。',
            },
            {
              step: '02',
              title: 'AI 掃描 & 生成回覆',
              desc: '系統自動掃描 Threads 相關貼文，AI 分析內容並生成適合的推廣留言。',
            },
            {
              step: '03',
              title: '審核 & 發布',
              desc: '在儀表板查看 AI 生成的回覆，確認內容後一鍵發布到 Threads。',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/10 text-blue-500 font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/20 p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">準備好開始了嗎？</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            立即進入儀表板，設定你的第一個監控關鍵字，讓 AI 開始為你工作。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold transition-colors"
          >
            進入儀表板
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Coupang Patrol</span>
          </div>
          <span>© 2024 Coupang Patrol. 僅供展示用途。</span>
        </div>
      </footer>
    </div>
  )
}
