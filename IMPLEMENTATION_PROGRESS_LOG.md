# Iceland Insight 實作進度紀錄

更新日期：2026-06-22  
用途：依照既有 Phase 規劃，集中記錄實作進度、決策、阻塞與下一步

---

## 使用方式

- 每完成一項功能，更新對應 Phase 與項目狀態
- 完成後填入「產出」與「驗收結果」即可
- 每日最多更新 1 次「今日總結」即可，避免過度紀錄

狀態定義：
- `待辦`：尚未開始
- `進行中`：進行中
- `阻塞`：卡住待解
- `完成`：完成並驗收

---

## Phase 0：專案啟動（2~3 天）

### 0-1 建立 monorepo / app 結構
- 狀態：進行中
- 產出：
	- 已建立 `package.json`（package manager: pnpm 11.8.0）
	- 已產生 `pnpm-lock.yaml` 與 `node_modules`
	- 已完成第一批核心依賴與開發依賴安裝（見 2026-06-22 紀錄）
	- 已建立 Next.js 最小骨架：`app/layout.tsx`、`app/page.tsx`、`app/globals.css`
	- 已建立設定檔：`next.config.ts`、`tsconfig.json`、`eslint.config.mjs`、`next-env.d.ts`
	- 已更新 scripts：`dev`、`build`、`start`、`lint`
- 驗收結果：
	- `corepack pnpm list --depth 0` 可列出完整 top-level 套件
	- `corepack pnpm build` 成功，首頁 route 可產生

### 0-2 資料契約落地
- 狀態：完成
- 產出：
	- 已建立共用型別：[src/types/domain.ts](src/types/domain.ts)
	- 已建立型別匯出入口：[src/types/index.ts](src/types/index.ts)
	- 已建立 Zod schema：[src/schemas/domain.ts](src/schemas/domain.ts)
	- 已建立 schema 匯出入口：[src/schemas/index.ts](src/schemas/index.ts)
	- 已建立 mock fixtures：`normal` / `degraded` / `failure`
- 驗收結果：
	- `corepack pnpm lint` 成功
	- `corepack pnpm build` 成功
	- `normal` / `degraded` / `failure` fixtures 均可通過對應 schema parse

---

## Phase 1：BFF 與資料層（4~6 天）

### 1-1 Vedur + Road API 聚合
- 狀態：完成（核心鏈打通，可取得真實資料）
- 產出：
	- 通用傳輸層（timeout 3s / retry 2）：[src/lib/http/client.ts](src/lib/http/client.ts)
	- Vedur 唯一抓取點 + 專屬設定（就近）：[src/lib/api/vedur.ts](src/lib/api/vedur.ts)
	- 天氣純解析 `parseWeather`：[src/lib/adapters/weather.ts](src/lib/adapters/weather.ts)
	- 路況純推算 `deriveRoads`（公式見 docs §9）：[src/lib/adapters/road.ts](src/lib/adapters/road.ts)
	- App 級設定：[src/lib/config/app.ts](src/lib/config/app.ts)
	- BFF route（接收/驗證/協調/回傳）：[src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
	- 架構：fetcher 抓一次 raw → weather/road 各自純函式解析 → route 合併並出口驗證
	- 資料夾分層：`api/`(對外來源) + `http/`(傳輸) + `config/`(設定) + `adapters/`(純解析)
	- 端點路徑：`/data/iceland-status`（全專案僅一個對外 api 概念）
- 驗收結果：
	- `corepack pnpm lint` / `corepack pnpm build` 成功，route 註冊為 `ƒ /data/iceland-status`
	- `region=mars` → 400 `INVALID_REGION`；上游不可達 → 503 統一 error 格式
	- 實打 Vedur 成功：`GET /data/iceland-status?region=south` → 200，回傳真實即時觀測
	- 解析容錯修正：Vedur `time` 補 UTC（`normalizeVedurTime`）、數值欄位允許 `null`、`r: null → undefined`
- 已知缺口（不影響取得資料）：
	- weather/road 的 `lat/lon` 目前為 0（AWS 觀測未帶座標，需接 `stations` 端點對照站點經緯度）
- 後續：快取 / 斷路器 / fallback 移至 Phase 1-2

### 1-2 快取與斷路器
- 狀態：完成（記憶體版，之後可無痛換 Redis）
- 產出：
	- 快取抽象介面 + 記憶體實作：[src/lib/cache/store.ts](src/lib/cache/store.ts)
	- 快取單例 + 鍵產生 + TTL：[src/lib/cache/index.ts](src/lib/cache/index.ts)
	- 斷路器（5 次失敗開啟 / 60s 半開）：[src/lib/http/circuit-breaker.ts](src/lib/http/circuit-breaker.ts)
	- route 串入流程：快取命中 → 斷路器抓上游 → fallback（stale cache → snapshot fixture）：[src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
	- 快取鍵：`status:{region}:{timeslot}`，TTL 900s
- 驗收結果：
	- `corepack pnpm lint` / `corepack pnpm build` 成功
	- 快取：暖身 miss → 後續 `cache=hit`（真實 43 站資料）
	- fallback：壞上游 + 無快取 → 回 snapshot（`cache=miss, fallback=true`，region 正確覆寫）
- 待辦：之後換 Upstash Redis（只需替換 cache 單例）；Sentry 結構化日誌移至 1-3

#### BFF 流程優化清單（2026-06-24 盤點）
> 目的：讓資料流更順、更省、更穩。以下依優先序，逐項實作。

- [完成] ① Stale-While-Revalidate：快取過期時先回 stale（秒回），背景再 single-flight 更新
- [完成] ② Single-flight 請求合併：同一 key 同時只放一個請求打上游，其餘共用結果
	- 產出：[src/lib/http/single-flight.ts](src/lib/http/single-flight.ts)（`SingleFlight` 類別 + `statusSingleFlight` 單例）
	- route 流程改為：新鮮快取→hit；過期快取→秒回 stale + 背景 `revalidate`（不 await）；無快取→await single-flight 抓上游，失敗回 snapshot
	- 驗收：`lint` / `build` 通過；實測 miss→fetch（43 站）、重打 `cache=hit`、`region=mars`/`at=notadate` 皆回 400
- [待辦] ③ HTTP 快取標頭（`Cache-Control: s-maxage / stale-while-revalidate`）：讓 Vercel CDN 擋掉重複請求（雲端部署前處理）
- [完成] ④ 區分錯誤類型：`UpstreamError`→fallback、程式/資料錯誤→500 並上報（隨 1-3 一起完成）
- [待辦] ⑤ Rate Limit（規格 §2.6：每 IP 每分鐘 60 次）
- [完成] ⑥ 觀測日誌（即 1-3：requestId / latency / cacheState + Sentry hook）

### 1-3 觀測與告警
- 狀態：結構化日誌 + 錯誤分流完成；Sentry 接入與失敗率告警依決定延後（hook 已備妥）
- 產出：
	- 結構化日誌模組（單行 JSON，依嚴重度分流 stdout/stderr）：[src/lib/observability/logger.ts](src/lib/observability/logger.ts)
	- 例外上報入口（`captureException`，DSN 未設時零成本、設定後動態載入 @sentry/nextjs）：[src/lib/observability/index.ts](src/lib/observability/index.ts)
	- transport 錯誤統一收斂為 `UpstreamError`（逾時 / 非 2xx / 網路）：[src/lib/http/client.ts](src/lib/http/client.ts)
	- route 錯誤分流 + 每請求觀測欄位（requestId / region / source / latencyMs / cacheState / fallback / status），並回 `x-request-id` 標頭：[src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
- 錯誤分流策略：
	- `UpstreamError`（上游問題）→ 計入斷路器、走 fallback（stale → snapshot）
	- 非上游錯誤（程式 / 資料 bug）→ **不**拖累斷路器、上報 Sentry、無快取時回 500（不被 fallback 掩蓋）
- 觀測出口說明：requestId / latencyMs 寫入**伺服器端 stdout**（跨 `pnpm dev` 終端機 / Vercel logs），非 HTTP 回應 body；requestId 另以 `x-request-id` 標頭回傳
- 已完成（對應 §1-3 三項）：
	- ② 每請求 requestId + latency——已寫入結構化日誌
- 依決定延後（需 Sentry DSN）：
	- ① 接入 Sentry：程式端 hook 已備（`captureException`），但尚未提供 DSN / instrumentation，未真正上報
	- ③ 失敗率告警（5 分鐘 > 10%）：屬 Sentry 後台規則，依賴 ①

---

## Phase 2：3D 地圖與互動 UI（7~10 天）

### 2-0 前置：天氣測站座標回填（lat/lon backfill）
- 狀態：完成
- 背景：AWS 觀測（`observations/aws/hour/latest`）不帶 lat/lon，3D 點位渲染需要座標
- 解法：以 station id 對照測站主檔（`stations?region_id=`）回填座標
- 產出：
	- I/O 來源：`fetchVedurStations` + `RawVedurStation`：[src/lib/api/vedur.ts](src/lib/api/vedur.ts)
	- 純轉換：`buildStationCoords`（station id → 座標，過濾無座標站）：[src/lib/adapters/stations.ts](src/lib/adapters/stations.ts)
	- 快取型存取（24h TTL，失敗優雅降級回 stale/空表）：[src/lib/stations/catalog.ts](src/lib/stations/catalog.ts)
	- `parseWeather(raw, coords)` 回填，優先序「主檔 → 觀測自帶 → 0」：[src/lib/adapters/weather.ts](src/lib/adapters/weather.ts)
	- route `fetchFresh` 並行抓觀測 + 主檔：[src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
- 驗收結果：
	- 上游驗證：south 區 43 觀測站對 121 測站主檔，座標涵蓋率 100%
	- `corepack pnpm lint` / `corepack pnpm build` 成功
	- 實測 `region=east`：weatherN=20、withCoords=20，座標為真實東部冰島經緯（約 65.28°N, -14°W）
- 設計取捨：主檔失敗不阻斷 iceland-status（座標回填為加值，非關鍵路徑）

### 2-1 3D 場景與地形 LOD
- 狀態：待辦
- 產出：
- 驗收結果：

### 2-2 InstancedMesh 即時點位渲染
- 狀態：待辦
- 產出：
- 驗收結果：

### 2-3 2D/3D 聯動時間軸
- 狀態：待辦
- 產出：
- 驗收結果：

### 2-4 行動端手勢隔離
- 狀態：待辦
- 產出：
- 驗收結果：

---

## Phase 3：AI 智慧規劃（4~6 天）

### 3-1 AI 行程生成
- 狀態：待辦
- 產出：
- 驗收結果：

### 3-2 AI 結果轉 3D 錨點
- 狀態：待辦
- 產出：
- 驗收結果：

### 3-3 Web Worker 路徑校準
- 狀態：待辦
- 產出：
- 驗收結果：

---

## Phase 4：測試、上線與營運（3~5 天）

### 4-1 測試策略
- 狀態：待辦
- 產出：
- 驗收結果：

### 4-2 效能與壓力測試
- 狀態：todo
- 產出：
- 驗收結果：

### 4-3 CI/CD 上線策略
- 狀態：todo
- 產出：
- 驗收結果：

---

## 功能級紀錄（按鈕/元件專用）

### 功能：飛到景點按鈕
- 所屬 Phase：2-3
- 狀態：todo
- 視覺規格：
- 功能流程：
- 涉及模組：
- 驗收標準：
- 備註：

---

## 架構決策紀錄（Pre-Phase 0 / 2026-06-21）

> 用途：記錄開始實作前，在 AI 協作對話中確認的所有架構決策與選型。  
> 未來新 session 可直接引用此段落，快速還原決策脈絡。

### 建立此紀錄所使用的提問流程（Prompt 脈絡）

1. 「你先檢視裡面的 md，並且告訴我你接下來想要幹什麼？」— 讓 AI 先讀文件再規劃
2. 「前後端你跟我對一下，我確認一下內容」— 對齊資料模型與 API 契約
3. 「後端的部分沒有建議安裝或處理？其他控制像是 input section 利用 shadcn；再確認一下還有什麼內容有缺少的」— 補完套件清單
4. 「你把裡面每一套件扮演的功能跟角色分析完畢」— 逐一確認每個套件用途
5. 「你會建議利用 Docker 進行開發？前後端是否是分開的？」— 確認架構模式
6. 「我之後應該會增加簡易的 CRUD，你會建議怎麼擴充？」— 確認未來資料庫方向
7. 「所以不考慮 MySQL 之類？最後再確認一次所有東西有什麼遺漏的」— 最終缺口盤點

### 確認決策清單

| 項目 | 決策 | 備註 |
|---|---|---|
| 框架 | Next.js App Router | 前後端同一 codebase，BFF = Route Handlers |
| Package Manager | **pnpm** | 速度快、省磁碟 |
| Node 版本 | Node 20 LTS | 執行前 `node -v` 確認 |
| 3D 引擎 | Three.js + @react-three/fiber + @react-three/drei | |
| 狀態管理 | Zustand | 管理天氣、相機、時間軸等跨元件狀態 |
| API 驗證 | Zod | BFF 收到外部 API 資料後先驗證再往前端送 |
| UI 元件 | Tailwind CSS + shadcn/ui | shadcn 用 CLI 安裝，非 npm 套件 |
| 天氣來源 | Vedur API | `api.vedur.is`，官方，無需 API key（目前） |
| 極光來源 | NOAA SWPC JSON | 公開，無需 API key，**納入 MVP** |
| 路況來源 | **Vedur 欄位推算**，不用 Umferdin | 推算公式記錄於 `docs/api/iceland-traffic-api.md §9` |
| 地形底圖 | Three.js mesh + NASA 衛星圖 texture（B 方案） | 免費公開，預估 2-3 天完成 |
| AI 功能 | **MVP 暫不做**，Phase 3 再加 | `ai`, `@ai-sdk/openai` 暫不安裝 |
| 快取 | Upstash Redis | Phase 1 後期加入，MVP 初期不需要 |
| Docker | **不用** | Next.js + Upstash 雲端，`npm run dev` 直接跑 |
| 前後端分離 | **不分離** | 同一 Next.js 專案，共用 TypeScript 型別 |
| 部署 | Vercel | 不需要 Dockerfile |
| 未來 CRUD | Supabase（Auth + PostgreSQL） | Phase 3 後加入，現在不裝 |
| 資料庫 | PostgreSQL（未來用） | 不用 MySQL |

### 本次補上的技術缺口

- `AuroraConditions` 型別已加入 `PROJECT_SPEC_AND_PLAN.md §2.2`
- BFF 回應 JSON 已加入 `"aurora": []` 欄位（`§2.3`）
- Road risk 推算公式已記錄於 `docs/api/iceland-traffic-api.md §9`
- pnpm 已記錄於 `PROJECT_SPEC_AND_PLAN.md §2.1`

---

## 每日摘要

### 2026-06-18
- 今日完成：建立規格書、功能模板、工程示例、進度紀錄檔
- 今日完成：補充 API 文件集中化與 AI 驗證 API 來源流程紀錄（docs/api）
- 今日完成：補上「你做了什麼 / AI 建議什麼」的 API 來源確認協作紀錄
- 今日阻塞：尚未初始化實作專案骨架
- 明日目標：開始 Phase 0-1（專案結構）

### 2026-06-21
- 今日完成：Pre-Phase 0 架構決策對齊（套件選型、資料庫、前後端架構、Docker 與否）
- 今日完成：補上 AuroraConditions 型別、BFF aurora 欄位、road risk 推算公式
- 今日完成：確認 pnpm 為 package manager，Node 20 LTS
- 今日阻塞：尚未初始化實作專案骨架（等待執行指令）
- 下一步：執行 Phase 0-1（`pnpm create next-app` 初始化專案）

### 2026-06-22
- 今日完成：在現有 workspace 初始化 pnpm 專案（`corepack pnpm init`）
- 今日完成：安裝核心依賴（Next/React/Three/R3F/Zustand/Zod/Upstash/Sentry）
- 今日完成：安裝開發依賴（TypeScript/@types/ESLint/Prettier）
- 安裝指令：
	- `corepack pnpm add next react react-dom three @react-three/fiber @react-three/drei zustand zod @upstash/redis @sentry/nextjs`
	- `corepack pnpm add -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next prettier --ignore-scripts`
- 目前已安裝（top-level）：
	- dependencies：`@react-three/drei@10.7.7`、`@react-three/fiber@9.6.1`、`@sentry/nextjs@10.59.0`、`@upstash/redis@1.38.0`、`next@16.2.9`、`react@19.2.7`、`react-dom@19.2.7`、`three@0.184.0`、`zod@4.4.3`、`zustand@5.0.14`
	- devDependencies：`@types/node@26.0.0`、`@types/react@19.2.17`、`@types/react-dom@19.2.3`、`eslint@10.5.0`、`eslint-config-next@16.2.9`、`prettier@3.8.4`、`typescript@6.0.3`
- 注意事項：
	- pnpm 安全策略目前忽略 build scripts（`@sentry/cli`、`sharp`）；如需允許請執行 `corepack pnpm approve-builds`
- 今日阻塞：尚未建立 Next.js app 檔案骨架（目前僅完成套件層）
- 下一步：執行 Next.js 骨架初始化或手動建立 `app/`、`next.config`、`tsconfig`、`eslint` 設定

### 2026-06-22（續）
- 今日完成：建立 Next.js App Router + TypeScript + ESLint 最小可跑骨架
- 今日完成：建立首頁與全域樣式，補齊基礎設定檔與 scripts
- 今日完成：驗證 `corepack pnpm lint`（無錯誤）與 `corepack pnpm build`（成功）
- 今日完成：建立 Phase 0-2 共用 domain types、Zod schemas、mock fixtures
- 今日完成：新增 `IcelandStatusResponse` / `ApiErrorResponse` 等資料契約
- 今日完成：驗證所有 fixtures 可通過 schema parse（`schema-fixtures: ok`）
- 注意事項：Next.js 偵測到工作區外層有其他 lockfile，顯示 workspace root 推斷警告；不影響目前 build
- 下一步：開始 Phase 1-1（Vedur / Road adapters）

### 2026-06-22（Phase 1-1）
- 今日完成：建立 Vedur BFF 資料鏈（http/client、api/vedur、adapters/weather+road、/data route）
- 今日完成：依「只接收/傳輸」原則重整資料夾 → `api/` + `http/` + `config/` + `adapters/`
- 今日完成：端點改為 `/data/iceland-status`，同步更新規格書引用
- 今日完成：實打 Vedur API 成功，`region=south` 回傳真實即時觀測（HTTP 200）
- 今日修正：503 主因非連線失敗，而是出口驗證過嚴
	- `time` 無時區 → `normalizeVedurTime` 補 UTC
	- 數值欄位允許 `null`；降水 `r: null → undefined`
- 已 push：`a2014f5..9671b76`（feat(api): Vedur BFF chain）
- 已知缺口：weather/road 的 `lat/lon` 仍為 0（待接 Vedur `stations` 對照站點座標）
- 下一步（擇一）：補站點經緯度，或進 Phase 1-2（快取 + 斷路器 + fallback）

### 2026-06-24（Phase 1-2）
- 今日完成：快取抽象層（介面 + 記憶體實作），之後換 Redis 只改單例
- 今日完成：斷路器（連續 5 次失敗開啟、60s 半開試探）
- 今日完成：route 串入「快取命中 → 斷路器抓上游 → fallback（stale → snapshot）」
- 驗收：快取 miss→hit（真實 43 站）；壞上游無快取 → snapshot fallback（`fallback=true`）
- 決策：MVP 先用記憶體快取（不需 Upstash 金鑰），介面已抽象、可無痛換 Redis
- 下一步（擇一）：補站點經緯度、Phase 1-3（Sentry 觀測/告警），或接 Upstash Redis
