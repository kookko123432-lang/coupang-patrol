const mockAuthors = [
  '小美的生活日記', '韓國代購達人', '省钱媽媽', '台北美食客',
  '購物狂日記', '育兒生活家', '韓流粉絲團', '省錢小資女',
  '美妝實驗室', '居家生活美學', '零食控的天堂', '媽咪育兒經',
  '韓國留學生日記', '優惠情報局', '生活小百科',
]

const mockContents = [
  '最近想買一些韓國零食，有人可以推薦嗎？聽說酷澎上面很多選擇',
  '尿布真的好貴...有人知道哪裡買比較便宜嗎？酷澎的價格如何？',
  '求推薦韓國保養品！之前去首爾買的都用完了，想在網路上回購',
  '酷澎的送貨速度真的很快耶！昨天訂今天就到了，有人也用過嗎？',
  '寶寶的副食品食材都在哪裡買啊？想找有機的但又不要太貴',
  '最近在酷澎看到很多韓國生活用品，有人買過嗎？品質怎麼樣？',
  '韓國泡麵哪個牌子最好吃？想買一箱來試試，朋友推薦辛拉面',
  '有人用過酷澎的會員嗎？免運門檻是多少？划算嗎？',
  '推薦一下好用的洗衣精！我皮膚比較敏感，需要溫和一點的',
  '韓國美妝在酷澎買得到嗎？價格跟免稅店比起來如何？',
  '想買一些韓國的居家收納用品，酷澎上面選擇多嗎？',
  '新生兒尿布推薦哪個品牌？好奇、妙而舒、幫寶適哪個好？',
  '最近酷澎有什麼優惠活動嗎？想趁打折囤一些日用品',
  '有人買過酷澎的冷凍食品嗎？韓國炸雞看起來好好吃',
  '求推薦韓國洗髮精！頭皮容易出油，需要控油效果好的',
]

const mockKeywords = ['酷澎推薦', '尿布推薦', '韓國零食', '酷澎', '韓國美妝', '省錢']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface MockScannedPost {
  threadsPostId: string
  authorName: string
  content: string
  keywordId: string
  keyword: string
  likeCount: number
  replyCount: number
}

export function generateMockPosts(count: number = 5): MockScannedPost[] {
  const posts: MockScannedPost[] = []

  for (let i = 0; i < count; i++) {
    const keyword = randomItem(mockKeywords)
    posts.push({
      threadsPostId: `threads_post_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      authorName: randomItem(mockAuthors),
      content: randomItem(mockContents),
      keywordId: `kw_${randomInt(1, 10)}`,
      keyword,
      likeCount: randomInt(0, 200),
      replyCount: randomInt(0, 30),
    })
  }

  return posts
}

export function generateMockScanLog(keywordId?: string) {
  return {
    id: `log_${Date.now()}`,
    postsFound: randomInt(2, 12),
    status: 'completed',
    startedAt: new Date(),
    completedAt: new Date(Date.now() + randomInt(2000, 8000)),
  }
}
