import type { Metadata } from 'next'

export const metadata: Metadata = { title: '服務條款 | Coupang Patrol' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">服務條款</h1>
        <p className="text-gray-400 text-sm mb-8">最後更新：2026 年 3 月 31 日</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-100">1. 服務說明</h2>
            <p className="text-gray-300">Coupang Patrol 是一款社群媒體管理工具，協助用戶搜尋社群平台上的相關貼文、生成互動建議，並管理分潤推廣活動。本服務由 Coupang Patrol 團隊（以下簡稱「我們」）提供。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">2. 使用資格</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>您必須年滿 18 歲或達到您所在司法管轄區的法定成年年齡</li>
              <li>您擁有或已獲授權使用所連結的社群媒體帳號</li>
              <li>您遵守各社群平台的服務條款與使用政策</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">3. 使用者責任</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>您對透過本服務發布的所有內容負全部責任</li>
              <li>所有自動生成的回覆建議須經您審核後方可發布</li>
              <li>您應確保發布內容符合相關法律法規及平台規範</li>
              <li>您不得利用本服務從事任何違法、詐欺或侵權行為</li>
              <li>您應妥善保管帳號憑證與 API 金鑰</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">4. 社群媒體平台授權</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>您授權本服務依您設定的參數存取您的社群媒體帳號</li>
              <li>本服務僅在您明確授權的範圍內操作您的帳號</li>
              <li>您可以隨時撤銷授權，終止本服務對您帳號的存取</li>
              <li>本服務遵守各平台的 API 使用條款與速率限制</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">5. 分潤連結與商業活動</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>您需自行申請並管理各平台的分潤/聯盟行銷計畫</li>
              <li>本服務不保證任何收益或轉換率</li>
              <li>您應確保分潤推廣活動符合當地法律法規（包含但不限於廣告標示義務）</li>
              <li>本服務不對第三方分潤平台的政策變更負責</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">6. AI 生成內容</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>本服務使用人工智慧技術生成互動建議</li>
              <li>AI 生成的內容可能不準確或不適當，您有責任審核所有內容</li>
              <li>我們不對 AI 生成內容的準確性、完整性或適當性作出保證</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">7. 服務可用性</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>我們致力於維持服務的穩定運行，但無法保證服務不中斷</li>
              <li>我們保留在不事先通知的情況下進行維護、更新或暫停服務的權利</li>
              <li>因不可抗力因素導致的服務中斷，我們不承擔責任</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">8. 免責聲明</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>本服務依「現狀」提供，不作任何形式的明示或暗示保證</li>
              <li>我們不對因使用本服務而產生的任何直接、間接、附帶或懲罰性損害負責</li>
              <li>我們不對任何第三方服務（社群平台、AI 服務等）的可用性或行為負責</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">9. 帳號終止</h2>
            <p className="text-gray-300">您可以隨時停止使用本服務並刪除您的帳號。我們保留因違反本條款而終止您存取權限的權利。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">10. 條款修改</h2>
            <p className="text-gray-300">我們保留隨時修改本條款的權利。繼續使用本服務即表示您同意修改後的條款。重大變更將提前通知。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">11. 準據法</h2>
            <p className="text-gray-300">本條款適用中華民國（台灣）法律。因本條款產生的任何爭議，雙方同意以台灣相關法院為第一審管轄法院。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-100">12. 聯絡資訊</h2>
            <p className="text-gray-300">如有任何關於本條款的問題，請聯絡：</p>
            <ul className="list-disc pl-6 text-gray-300 space-y-1">
              <li>電子郵件：legal@coupang-patrol.vercel.app</li>
              <li>GitHub：https://github.com/kookko123432-lang/coupang-patrol</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
