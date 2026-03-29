# Coupang Patrol — Threads AI 海巡分潤系統

## 概述
一個 Web App，用戶連結 Threads 帳號後，AI 自動掃描相關貼文、生成推廣文案、附上酷澎分潤連結並自動留言。提供儀表板追蹤成效。

## 技術棧
- **Frontend**: Next.js 14 (App Router) + TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Database**: SQLite (Prisma ORM) — 輕量起步，之後可換 PostgreSQL
- **AI**: OpenAI GPT-4o-mini (文案生成)
- **Social API**: Threads API (Meta Graph API)
- **Scheduler**: node-cron (背景排程)
- **Deployment**: 先 local dev，之後 Vercel

## Phase 1 — MVP 功能

### 1. 用戶系統
- Threads OAuth 2.0 登入
- 存儲 access_token + refresh_token
- 用戶設定頁面（品牌語氣、推廣商品、關鍵字）

### 2. 關鍵字海巡
- 用戶設定監控關鍵字（例如：「酷澎推薦」「尿布推薦」「韓國零食」）
- 每 15 分鐘用 Threads API Keyword Search 掃描一次
- 過濾掉已回覆過的貼文
- 新貼文進入待處理佇列

### 3. AI 文案生成
- 分析目標貼文內容
- 根據用戶的品牌語氣 + 推廣商品設定
- 生成自然、有價值的留言（非硬廣）
- 自動附上酷澎 affiliate 連結

### 4. 審核 & 發布
- **手動模式**（預設）：AI 生成文案後進入「待審核」列表，用戶確認後才發布
- **全自動模式**：AI 審核通過直接發（之後做）
- 一鍵發布到 Threads

### 5. 儀表板
- 今日掃描數 / 回覆數
- 待審核列表（可編輯、刪除、發布）
- 已發布歷史紀錄
- 關鍵字管理

## 頁面結構

```
/                    → Landing page（產品介紹 + 登入按鈕）
/dashboard           → 主儀表板（概覽）
/dashboard/scan      → 掃描結果 & 待審核
/dashboard/keywords  → 關鍵字管理
/dashboard/products  → 推廣商品管理
/dashboard/history   → 發布歷史
/dashboard/settings  → 帳號設定
```

## Database Schema

```sql
-- 用戶
users (
  id, threads_user_id, username, display_name,
  access_token, refresh_token, token_expires_at,
  brand_tone,  -- 品牌語氣描述
  auto_mode BOOLEAN DEFAULT false,
  created_at, updated_at
)

-- 監控關鍵字
keywords (
  id, user_id, keyword, active BOOLEAN,
  created_at
)

-- 推廣商品
products (
  id, user_id, name, description,
  affiliate_url,  -- 酷澎分潤連結
  category, active BOOLEAN,
  created_at
)

-- 掃描到的貼文
scanned_posts (
  id, user_id, keyword_id,
  threads_post_id, author_username, content,
  scanned_at
)

-- AI 生成的回覆
generated_replies (
  id, user_id, scanned_post_id, product_id,
  content,  -- AI 生成的文案
  status ENUM('pending', 'approved', 'published', 'rejected'),
  published_at,
  created_at
)

-- 掃描排程日誌
scan_logs (
  id, user_id, keyword_id,
  posts_found, status,
  started_at, completed_at
)
```

## Threads API 整合

### OAuth 流程
1. 用戶點「連結 Threads」→ 導向 Meta OAuth 頁面
2. 用戶授權 → 回調帶 code → 換 access_token
3. 存入 DB，定時用 refresh_token 續期

### 所需 Scopes
- `threads_basic` — 讀取個人資料和貼文
- `threads_content_publish` — 發佈內容（含回覆）
- `threads_keyword_search` — 關鍵字搜尋（如已開放）

### API Endpoints 使用
- `GET /me` — 取得用戶資料
- `GET /me/threads` — 取得用戶貼文
- `POST /me/threads` — 發佈貼文/回覆
- Keyword Search — 搜尋相關貼文

## AI Prompt 設計

```
你是一個社群媒體行銷助手。你的任務是根據目標貼文內容，生成一段自然、有價值的回覆留言。

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
7. 繁體中文
```

## UI 設計方向
- 深色主題為主，科技感
- 左側 sidebar 導航
- 儀表板用卡片式佈局
- 掃描結果用列表 + 卡片混搭
- 即時狀態指示（掃描中 / 待審核 / 已發布）

## 開發優先順序
1. 專案初始化 + DB schema + 基礎 UI layout
2. Threads OAuth 登入流程
3. 關鍵字管理 CRUD
4. 推廣商品管理 CRUD
5. 海巡掃描引擎（ Threads API 搜尋）
6. AI 文案生成（OpenAI 整合）
7. 審核 & 發布流程
8. 儀表板數據統計
9. 排程自動化（node-cron）
10. Landing page
