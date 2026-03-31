import type { Metadata } from 'next'

export const metadata: Metadata = { title: '隱私政策 | Coupang Patrol' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">隱私權政策</h1>
        <p className="text-gray-400 text-sm mb-8">最後更新：2026 年 3 月 31 日</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-100">1. 簡介</h2>
            <p className="text-gray-300">Coupang Patrol（以下簡稱「本服務」）由 Coupang Patrol 團隊營運。我們致力於保護您的隱私權，本隱私權政策說明我們如何收集、使用、儲存和保護您的個人資料。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">2. 我們收集的資料</h2>
            <h3 className="text-lg font-medium text-gray-200">2.1 您提供的資料</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>社群媒體帳號資訊（經您授權的 Threads、X/Twitter 等帳號資料）</li>
              <li>商品資訊與分潤連結</li>
              <li>搜尋關鍵字設定</li>
              <li>AI 引擎設定與 API 金鑰</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-200 mt-3">2.2 自動收集的資料</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>掃描的社群媒體貼文（公開內容）</li>
              <li>生成的 AI 回覆內容</li>
              <li>發布紀錄與成效數據</li>
              <li>服務使用日誌</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">3. 資料的使用目的</h2>
            <p className="text-gray-300">我們使用收集的資料用於：</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>提供並改善本服務的核心功能</li>
              <li>依您的設定，自動或半自動搜尋社群媒體貼文</li>
              <li>生成回覆建議並經您審核後發布</li>
              <li>提供數據分析與成效報告</li>
              <li>確保服務安全性與穩定性</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">4. 資料的儲存與保護</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>所有資料經加密後儲存於安全的雲端伺服器</li>
              <li>API 金鑰使用加密環境變數儲存，不會以明文形式保存</li>
              <li>社群媒體存取權杖（Access Token）定期更新，並採用最小權限原則</li>
              <li>我們採用業界標準的 HTTPS 加密傳輸</li>
              <li>資料保留期限：您刪除帳號後 30 天內清除所有個人資料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">5. 第三方服務</h2>
            <p className="text-gray-300">本服務可能整合以下第三方服務：</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li><strong>Meta / Threads API</strong> — 用於讀取與發布 Threads 內容（需您授權）</li>
              <li><strong>AI 服務提供商</strong>（OpenAI、Google AI、智譜 AI）— 用於生成回覆建議</li>
              <li><strong>雲端服務</strong>（Vercel、GitHub、Redis）— 用於託管與資料儲存</li>
            </ul>
            <p className="text-gray-300">各第三方服務有其獨立的隱私權政策，建議您一併閱讀。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">6. 您的權利</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>隨時檢視、修改或刪除您的個人資料</li>
              <li>隨時撤銷社群媒體帳號的授權</li>
              <li>要求匯出您的資料</li>
              <li>要求刪除您的帳號及所有相關資料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">7. Cookie 與追蹤技術</h2>
            <p className="text-gray-300">本服務使用必要的 Cookie 以維持登入狀態與服務正常運作。我們不使用廣告追蹤 Cookie。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">8. 兒童隱私</h2>
            <p className="text-gray-300">本服務不針對 13 歲以下兒童，我們不會故意收集兒童的個人資料。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">9. 政策更新</h2>
            <p className="text-gray-300">我們可能不時更新本隱私權政策。重大變更將透過電子郵件或服務內通知告知您。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">10. 聯絡我們</h2>
            <p className="text-gray-300">如有任何關於隱私權的問題，請透過以下方式聯絡我們：</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>電子郵件：privacy@coupang-patrol.vercel.app</li>
              <li>GitHub：https://github.com/kookko123432-lang/coupang-patrol</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
