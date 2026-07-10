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

## Phase 1.5：最小可用網站（前後端串接 + 部署）（1~2 天）

> 2026-06-25 新增里程碑：後端/資料層已完成，但前端為 0 且未部署過。
> 先以簡易面板串接前後端、隨即部署，取得最基礎可上線版本，再進 3D（Phase 2）。

### 1.5-1 前端最小資料面板
- 狀態：完成
- 產出：
	- 資料 hook（CSR，封裝 fetch + loading/error，AbortController 防 race，可被 Phase 2 3D 重用）：[src/lib/client/use-iceland-status.ts](src/lib/client/use-iceland-status.ts)
	- region 切換按鈕列（純呈現 + 回呼）：[src/components/RegionSelector.tsx](src/components/RegionSelector.tsx)
	- 天氣/路況摘要面板（loading / error / fallback 三態，含 cache 狀態徽章）：[src/components/StatusPanel.tsx](src/components/StatusPanel.tsx)
	- 首頁組裝（持有 region state）：[src/app/page.tsx](src/app/page.tsx)
	- 暗色底樣式：[src/app/globals.css](src/app/globals.css)
- 驗收結果：
	- `corepack pnpm lint` / `corepack pnpm build` 成功
	- 首頁 HTTP 200、標題正確渲染；切 region 即時更新面板（CSR）
	- 對應 BFF `meta.cache` / `fallback` 顯示資料狀態徽章
- 過程修正：hook 內同步 setState 觸發 `react-hooks/set-state-in-effect`，改以 effect 內 async `load()` 包裝後通過

> 技術債（2026-06-25 記錄，Phase 2 前補齊）：
> - **島嶼架構未落實**：為求快速 demo，1.5-1 採「整個 `page.tsx` 標 `"use client"`」的簡化做法。
>   理想做法應為 Server Component 當預設，僅把互動元件下放為 client island：
>   `page.tsx`(Server, 放 Header/外框) → `Dashboard.tsx`("use client", 持有 region state) → `RegionSelector` / `StatusPanel`。
> - **補齊時機**：Phase 2 加入 Navbar 等更多靜態區塊、或導入 Zustand 時一併重構邊界。
> - **觀念備註**：Zustand 解決的是「state 共享 / 免 props 鑽透」，**不**改變 server/client 邊界——讀 store 的元件仍須是 client。故 Zustand 無法取代 `"use client"` 的劃分，兩者是不同維度。
>
> 📒 面試用觀念筆記（SSR/CSR 邊界 × 狀態管理）：
> 1. **`"use client"` ≠ 狀態管理**：前者決定「元件在 server 還 client 執行、要不要送 JS 到瀏覽器」（執行邊界）；後者決定「state 放哪、如何共享」（資料維度）。兩者正交。
> 2. **SSR vs CSR 的真正差異不是『資料完不完整』**：切 region 時兩者都會拿到「完整一筆新資料」；差別在「拿到後重畫多少」——SSR 重新產生整頁（含沒變的 Header/按鈕，可能閃白），CSR 只更新有 diff 的區塊（局部、無閃爍）。
> 3. **選擇準則**：高互動 / 即時變動 / 不需 SEO → CSR；首屏速度 / SEO / 低互動 → SSR。本面板是「反覆切 region」的高互動場景 → CSR。
> 4. **useState 版 vs Zustand 版的邊界差異**：
>    - useState：state 必須住「共同父層」→ 父層被迫變 client（client 島較大）。
>    - Zustand：state 住獨立 store，葉子元件各自 `useStore()` → **父層可維持 Server**，client 邊界縮到真正互動的葉子（島更小更精準）。
> 5. **結論**：Zustand 的副作用好處是「讓父層不必為了持有 state 而下放成 client」，但它**不是**用來「省掉 CSR」，而是「把 CSR 邊界移到更精準的位置」。元件少、樹淺時（如本面板）用 useState 即可；元件多、樹深（Phase 2：3D + 時間軸 + 多面板）才導入 Zustand 才划算。

### 1.5-2 走骨架部署（Vercel）
- 狀態：完成（2026-06-25）
- 線上 URL：https://travel-in-island.vercel.app/
- 產出：
	- `package.json` 加 `"packageManager": "pnpm@11.8.0"`（Vercel 據此選對的 pnpm）
	- `.gitignore` 忽略 `.env` / `.env.*`（保留 `.env.example`）、`.vercel`
	- `pnpm-workspace.yaml` 的 `allowBuilds` 政策（明確表態 build script）：[pnpm-workspace.yaml](pnpm-workspace.yaml)
- 驗收結果：
	- 線上首頁 HTTP 200
	- 線上 `GET /data/iceland-status?region=south` → cache=miss（新 instance 首打）、fallback=False、weatherN=43、roadsN=43，真實資料
	- 本地以 Vercel 同款流程預演通過：`rm -rf node_modules && CI=1 corepack pnpm install --frozen-lockfile` exit 0、`corepack pnpm build` exit 0
- 部署除錯歷程（踩雷紀錄，皆為 pnpm 版本差異所致）：
	1. **lockfile 解析失敗**：`devEngines.onFail: download` 會在 lockfile 寫入 `packageManagerDependencies`/`@pnpm/exe`（pnpm-11-only 欄位），Vercel 端解析 `pnpm-lock.yaml` 直接報錯。→ 移除 `devEngines`、重生 lockfile。
	2. **`ERR_PNPM_IGNORED_BUILDS`**（CI exit 1）：`@sentry/cli`、`sharp`、`unrs-resolver` 有 build script 但未表態。曾試 `onlyBuiltDependencies` / `ignoredBuiltDependencies`（workspace.yaml 與 package.json `pnpm` 欄位）**皆無效**——因 pnpm v11 已**移除**這些鍵、且 package.json 的 `pnpm` 欄位**不再被讀取**。正解是 pnpm-workspace.yaml 的 `allowBuilds`（v10.26+）。
	3. **YAML 解析錯誤（重複鍵）**：每次 install 失敗，pnpm 會**自動在 workspace.yaml 頂端插入一個 placeholder `allowBuilds:` 區塊**，與我手寫的那塊並存 → 出現兩個 `allowBuilds` 鍵 → YAML 重複鍵解析失敗。→ 合併成單一區塊後通過。
- 📒 面試用觀念筆記（pnpm 11 / 部署）：
	1. **build script 安全模型**：pnpm 預設 `strictDepBuilds: true`，凡帶 postinstall 的相依若未在 `allowBuilds` 明確 `true`/`false`，CI 直接 exit 1（防供應鏈攻擊）。每個都要表態。
	2. **本機 ≠ CI**：本機非 CI 時 `ERR_PNPM_IGNORED_BUILDS` 只印警告不中斷；要重現 Vercel 失敗必須 `CI=1 ... --frozen-lockfile`。教訓：部署前先在本地用 CI 同款指令預演。
	3. **設定鍵會跨版本搬家**：v11 移除 `onlyBuiltDependencies`/`neverBuiltDependencies`/`ignoredBuiltDependencies`，統一為 `allowBuilds`；package.json 的 `pnpm` 欄位也不再讀。除錯時務必對齊「當前版本」的文件，別套舊經驗。
- 待辦延伸（已記錄，非阻斷）：Vercel 環境變數（目前 `VEDUR_BASE_URL` 有程式預設值，無必填）、Sentry DSN、③ HTTP 快取標頭。

### 1.5-3 元件架構重整 + 狀態分層（Phase 2 前的地基）
- 狀態：規劃完成、實作中（2026-06-26）
- 背景：1.5-1 為快速 demo，`Dashboard` 同時當「狀態擁有者」+「操作面板」，職責混合。
  地圖（也是會操作、會渲染的母組件）若硬塞進 `Dashboard` 會形成父子關係，與「面板/地圖為平行兄弟」的真實心智模型不符，且 3D 長大後難切乾淨。趁樹還淺先重整。
- 目標架構（面板與地圖為對等兄弟，靠共享狀態連動，非父子）：
	- `page.tsx`(Server, grid 版面外框) → 並排 `ControlPanel`(client 島) + `MapCanvas`(client 島)
	- 共享意圖狀態放 Zustand store；後端資料由 Context Provider 包 `useIcelandStatus` 供應（一處抓、兩島讀）
- 📒 面試用觀念筆記（狀態分層：client state vs server state）：
	1. **兩類狀態本質不同，要分開放**：
	   - **A 意圖狀態（client state）**：使用者「想看什麼」——`region` / `time` / `selectedStationId`。能「直接賦值」、同步、無 loading/error。→ 放 **Zustand**。
	   - **B 衍生資料（server state）**：後端回來的 `IcelandStatusResponse`。要發 API、有 loading/error、是「region 的函數」。→ 由 **hook 即時算出，不另存**。
	2. **data 不是獨立狀態，是 region 的『果』**：唯一真相源只有 region；data 永遠跟著 region 跑。資料**單向流動**：user 改 region → hook 看到 → 抓 BFF → 得 data → 畫面更新；region 不回頭依賴 data。
	3. **為何不讓 store 直接連 BFF**（即「region 變就在 setRegion 裡 fetch」）：會把 race condition（需 AbortController）、取消、loading/error、元件生命週期 cleanup 全部塞進「同步的狀態容器」，職責糊掉、重造輪子。這些是 React hook（useEffect 依賴 + cleanup）的專長。
	4. **宣告式 vs 命令式**：不要「region 變了我去 call BFF」（命令式 push）；而是「data 宣告為 region 的函數，region 變 React 自動重跑」（宣告式 pull）。關係只描述一次，之後自動成立。
	5. **Zustand ≒ 放在元件外面的 useState**：行為（記值、改值觸發重繪）與 useState 相同，差別只在「狀態住所」——useState 綁在元件身上（分享要 props 鑽透），Zustand 住模組單例（任何元件 import 即讀，免父層轉傳）。本專案 region 要給兩個平行兄弟共讀寫，故用 Zustand 讓父層不必為持有狀態而存在。
	6. **Context vs Zustand vs 主題**：Context 適合「一處抓、多處讀」的共享傳遞（這裡傳 data）；Zustand 管「被頻繁讀寫的意圖」；主題（dark mode）這種低頻全域設定用 Context（ThemeProvider）即可，不需 Zustand。三者各司其職。
- 一句記憶點：**Zustand 存「想要什麼」，hook 負責「去拿到並處理拿的過程」。旋鈕（region）和冷氣（fetch）分開，系統才好維護。**
- 實作範圍（本步）：見下方「待辦清單」；UI 同步導入 Tailwind v4 + shadcn/ui，`MapCanvas` 先做有版面結構的 placeholder 空殼。
- 實作產出（2026-06-26 完成）：
	- 工具鏈：Tailwind v4（CSS-first，[postcss.config.mjs](postcss.config.mjs)、[src/app/globals.css](src/app/globals.css) 暗色設計權杖）+ shadcn/ui（[components.json](components.json)、[src/lib/utils.ts](src/lib/utils.ts) 的 `cn()`、`button`/`card`/`badge` 於 [src/components/ui/](src/components/ui)）
	- 狀態層：Zustand store [src/lib/store/workspace.ts](src/lib/store/workspace.ts)；Context 供應 server state [src/components/providers/WorkspaceProvider.tsx](src/components/providers/WorkspaceProvider.tsx)
	- 元件（依領域分資料夾）：
		- 地圖領域 `map/`：[MapCanvas.tsx](src/components/map/MapCanvas.tsx)（全螢幕背景層 placeholder）
		- 面板領域 `panel/`：[FloatingPanel.tsx](src/components/panel/FloatingPanel.tsx)（可收合外殼）→ [ControlPanel.tsx](src/components/panel/ControlPanel.tsx)（容器）→ [RegionSelector.tsx](src/components/panel/RegionSelector.tsx) + [StatusPanel.tsx](src/components/panel/StatusPanel.tsx)
	- 版面：Google Maps 風格——地圖鋪滿視口背景、操作面板浮左可開合（[src/app/page.tsx](src/app/page.tsx) 用 `h-dvh` + `pointer-events` 分層）
- 踩雷紀錄：shadcn CLI 會直接 `spawn pnpm`（不透過 corepack），因 pnpm 未全域安裝而 `ENOENT`。解法：建本地 shim（`/tmp/pnpm-shim/pnpm` → `exec corepack pnpm "$@"`）並加進 PATH 再跑 `shadcn add`。
- 📒 工程取捨筆記（資料夾組織）：
	1. **三種常見策略**：扁平（少量檔案全平放，7~10 個以上才分）／按領域 feature-based（中大型主流）／按 UI 父子層級（不建議）。
	2. **資料夾表達「分類/領域」，不表達「父子」**：父子關係由 import 鏈表達，非資料夾深度。若按層級分，元件一旦被多處複用就無處可歸。
	3. **本專案選擇**：按**領域**分 `map/` + `panel/`（非按父子層級）。理由：Phase 2 可預期大幅長大（Terrain/Stations/Controls/Timeline/AI 面板…），先依領域分好，新元件知道該放哪，符合團隊 workflow；屬「偏謹慎但合理」的提前分類。

### 1.5-3 元件架構重整 — 收尾
- 狀態：完成（2026-06-26）
- 驗收結果：
	- `corepack pnpm lint` / `corepack pnpm build` 成功；首頁 HTTP 200
	- 面板可收合/展開；切 region 時 ControlPanel 與 MapCanvas 佔位的測站數同步變動（兄弟連動經 store + context 成立）
	- 天氣/路況改上下單欄排列、面板加寬至 460px

---

## Phase 2：3D 地圖與互動 UI（7~10 天）

### 2-3 時間軸 × 日照模型（2026-07-08 除錯紀錄）
- 狀態：完成（2026-07-09 驗收通過）
- 問題現象：07/08 10:00 ~ 11:36 間光照偶發「亮度突然變高再變低」，使用者觀察到 `day` 與 `sun` debug 值瞬間跳動。
- 根因摘要：前端同時混用第三方日照邊界模型與系統時間 fallback 模型，造成同一個 `selectedTime` 被兩套路徑各算一次後再混合，部分時段產生亮度尖峰。
- 修正摘要：
	- 新增獨立 `/data/sun-times` 與第三方 client
	- BFF 建立三天邊界 `sunBoundary`
	- 加入 threshold-based debug log 確認根因
	- 最終改為後端決策單一路徑 `sunModel`，前端 `Lighting` 只吃 `sunModel`
- 目前結果：
	- `get_errors` / `corepack pnpm lint` / `corepack pnpm build` / `home:200` 全數通過。
	- `/data/iceland-status?region=south` 已可回 `sunModelSource: sun` 與有效 `boundary`。
- 詳細紀錄：見 [docs/notes/debug-log.md](docs/notes/debug-log.md)
- 後續觀察重點：
	- 2-3 主線已完成並驗收；若後續出現回歸，再以 `sunModel.boundary` 對時點做定位。

### 2-0 前置：天氣測站座標回填（lat/lon backfill）
- 狀態：完成
- 名詞澄清：此處「AWS」＝ Automatic Weather Station（冰島氣象局自動氣象站），**與 Amazon Web Services 無關**。
- 為什麼需要回填（背景）：
	- Vedur 把同一件事拆成兩個端點：**觀測數據**（溫度/風速…，每小時變動，含 station id 但**無座標**）與**測站主檔**（座標/高程，幾乎不變，含 station id）。
	- 這是 API 常見設計：位置幾乎不變，不必每筆觀測都重複塞經緯度，改讓呼叫端用 `station` id 去主檔查一次即可。
	- 但 3D 地圖要把每個測站畫在正確位置，**沒有經緯度就無法定位**，故需把兩端點接起來。
- 解法（概念）：以共同的 `station` id 做「**左連接 JOIN**」——**觀測為主表**（有幾筆觀測就輸出幾筆），**主檔為查找表**（只用來補座標）。只在主檔、當下無觀測的測站不會出現在結果。
- 產出：
	- I/O 來源（兩個獨立抓取函式，對應兩個來源）：`fetchVedurObservations`、`fetchVedurStations` + `RawVedurStation`：[src/lib/api/vedur.ts](src/lib/api/vedur.ts)
	- 純轉換：`buildStationCoords`（把主檔變成 `station id → 座標` 查找表，過濾無座標站）：[src/lib/adapters/stations.ts](src/lib/adapters/stations.ts)
	- 快取型存取（24h TTL，失敗優雅降級回 stale/空表）：[src/lib/stations/catalog.ts](src/lib/stations/catalog.ts)
	- JOIN 發生處：`parseWeather(raw, coords)`，優先序「主檔 → 觀測自帶 → 0」：[src/lib/adapters/weather.ts](src/lib/adapters/weather.ts)
	- route `fetchFresh` 並行抓觀測 + 主檔：[src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
- 為什麼拆這麼多檔：兩來源「變動頻率」不同（觀測 900s、座標 24h），拆開才能各自套合適快取，不必為了拿座標每次重抓近乎不變的主檔。
- 驗收結果：
	- 上游驗證：south 區 43 觀測站對 121 測站主檔，座標涵蓋率 100%
	- `corepack pnpm lint` / `corepack pnpm build` 成功
	- 實測 `region=east`：weatherN=20、withCoords=20，座標為真實東部冰島經緯（約 65.28°N, -14°W）
- 設計取捨：主檔失敗不阻斷 iceland-status（座標回填為加值，非關鍵路徑）；主檔的 `ele`（高程）一併保留，供 Phase 2-2 點位貼地形表面用。

### 2-1 3D 場景與地形 LOD
- 狀態：規劃中（2026-06-29），分兩階段：2-1a low-poly 程序地形 → 2-1b 真實 DEM
- 📒 DEM 資料可行性研究（2026-06-29，僅打點測試、未下載大檔）：
	- **SRTM30m 不可用**：覆蓋僅 -60~60°N，冰島在 64~66°N **超界**，回 `elevation: null`。原計畫若直上 SRTM 會踩雷，已排除。
	- **ASTER30m（NASA，全球）可用**：內陸 64.5,-19.0 → 624m、雷克雅未克 64.13,-21.9 → 22m，合理。
	- **Mapzen30m 可用且含海底**：同點 637m，海洋為負值，更適合做「島嶼」邊界。
	- 取得方式：opentopodata 公開 API（免金鑰，限 1 req/s、1000/日、100 點/次）→ 一次性對冰島範圍打格點生成靜態 heightmap 存進專案，無執行期成本。自架/下載 tile 太重，MVP 不採。
- 路線決策：先做 low-poly（noise 假高度）跑通管線（Canvas/相機/位移/上色/座標系），再把高度來源換成 ASTER heightmap；殼共用，替換為局部，不白做。
- 產出：
	- **2-1a low-poly 程序地形完成（2026-06-30）**，依最小步逐 commit：
		- 工具鏈：安裝 @react-three/fiber 9.6.1 + @react-three/drei 10.7.7（three 0.184.0）、@types/three；以旋轉方塊驗證 R3F 在 Next 16 可渲染（commit f7f2a3c）。
		- 地塊 [src/components/map/Terrain.tsx](src/components/map/Terrain.tsx)：PlaneGeometry 128×128 段、繞 X −90° 躺平；逐頂點以 sin/cos 疊加寫高度（local Z → 世界 Y）；`computeVertexNormals` + flatShading 低多邊形（commit b543b3b、5f12118）。
		- 上色：依高度逐頂點 vertex colors（深海→淺海→沙岸→草原→岩地→雪線），material 開 `vertexColors`（commit 0e61a7d）。
		- 相機 [src/components/map/CameraRig.tsx](src/components/map/CameraRig.tsx)：切分 OrbitControls 成獨立角色層（限制留待後續）（commit 2f60ef9）。
		- 海面 [src/components/map/SeaLevel.tsx](src/components/map/SeaLevel.tsx)：y=0 半透明藍平面（44×44），蓋住水下地形形成「海」（commit 31cd632）。
		- 效能 [src/components/map/MapCanvasLoader.tsx](src/components/map/MapCanvasLoader.tsx)：`next/dynamic` + `ssr:false` 動態載入 MapCanvas，three.js 不進首包，附 loading fallback（commit 1bbecf3）。
		- 除錯輔助 [src/components/map/DebugAxes.tsx](src/components/map/DebugAxes.tsx)：誇張三軸（紅X/綠Y/藍Z），**刻意保留**以利對位（commit d11d334）。
	- 座標約定確立：X=東西、Y=高度、Z=南北；1 unit = 1 km；中心 = 冰島大致中心（供 2-1b DEM、2-2 測站共用）。
	- 觀念筆記 [docs/notes/r3f-concepts.md](docs/notes/r3f-concepts.md)：WebGL/座標系/頂點上色/R3F 標籤對應/dynamic import 等 7 則問答。
	- 開發規範 [.github/copilot-instructions.md](.github/copilot-instructions.md)：固化「最小步 → 驗證三連 → commit 前必問」workflow。
- 驗收結果：
	- 每步 `get_errors` 無誤、`corepack pnpm lint` 通過、home 200；`corepack pnpm build` 成功（`/` 維持 static，three.js 拆出獨立 chunk）。
	- 線上自動部署：https://travel-in-island.vercel.app/
- 下一步：**2-1b 真實 DEM**——以 opentopodata（ASTER30m/Mapzen）對冰島範圍打格點生成靜態 heightmap，替換 Terrain 的 sin 假高度。

- **2-1b 真實 DEM 進度（2026-07-01）**：
	- b-1/b-2：離線腳本 [scripts/fetch-dem.mjs](scripts/fetch-dem.mjs)（主源 Mapzen、連線失敗 fallback ASTER30m、限速 1req/s、落地存靜態檔）；產出 [public/dem/iceland-mapzen-128.json](public/dem/iceland-mapzen-128.json)（128×128、16384 點 0 null、-1592~2003m、僅 68KB）（commit c842ea1）。
	- b-3：Terrain 讀 heightmap 取代 sin，頂點一對一對齊（segments=grid−1）、公尺÷500 換算 unit（垂直誇張 2×）；方位/形狀已確認為真冰島（commit dc52cee）。
	- b-4：高度比例/海陸校正——由 bbox 推真實東西/南北 km 修正平面長寬比（不再正方形，南北≈27.9 units）；垂直高度改「公尺→km→除水平尺度得真實比例 × `VERTICAL_EXAGGERATION`(25)」，取代魔術數字 `METERS_PER_UNIT`；上色改用真實海拔公尺查色帶，海陸分界對齊真實 0m（與 y=0 SeaLevel 一致）。
	- b-5：海岸線裁切——海拔 <0 的頂點高度夾平到 `SEA_FLOOR_UNIT`(-0.3)，消除深達 -1592m 的大碗，島形輪廓＝自然 0m 海岸線。**取捨已註記可還原**：犧牲水下真實深度換乾淨島形；heightmap 已含負值高程，日後要海底峽谷/大陸棚只需顯示端改用陸地同公式並調透明海面（見 Terrain.tsx `SEA_FLOOR_UNIT` TODO）。
	- A 正式配色/光影（Phase 2-1b 收尾）：
		- A-1 移除 DebugAxes（[MapCanvas.tsx](src/components/map/MapCanvas.tsx) 卸載三軸，元件檔保留備用）。
		- A-2 冰島風低彩度色帶（[Terrain.tsx](src/components/map/Terrain.tsx)：深海→淺海→黑沙苔綠→苔原→玄武岩→雪白；[SeaLevel.tsx](src/components/map/SeaLevel.tsx) 海面同調）。
		- A-3 光影：`hemisphereLight`（冷天光）+ 壓低角度 `directionalLight`（太陽），強化 flatShading 立體感。
	- **技術債（待補，2026-07-01 記錄）**：
		1. `fetch` 失敗僅 `console.error`，缺 error 狀態 UI（載入失敗會空白無提示）。
		2. heightmap 未經 schema 驗證（`res.json()` 直接 as 型別）；專案已有 zod，之後用 zod parse 保護壞檔。
		3. Terrain 對 geometry 用 `as unknown as BufferGeometry` / `as never` cast 繞過 drei BVH 型別，非漂亮但無功能影響。
		4. `"/dem/..."` 路徑與地形尺度/誇張常數為硬編；未來多地形來源時抽 config。
		5. heightmap 讀取邏輯目前僅 Terrain 使用，暫不抽 hook；若日後 MiniMap／測站貼地形共用再抽 `useHeightmap`（YAGNI）。
	- 下一步：Phase 2-1b 地形完成，進 **Phase 2-2 測站點位**（InstancedMesh 畫 43 測站、以 `ele` 貼地形表面）。
	- **互動待辦（之後再補）**：目前縮放靠 OrbitControls 內建滾輪；尚未做「點測站/區域相機平滑聚焦飛入」與「UI +/- 縮放按鈕」，留待互動階段處理。
	- **地形清晰度待辦（之後再規劃執行）**：需求＝「放大時被放大的範圍能更清晰顯示更多細節」。根因＝目前 128×128 固定網格、頂點間距 ~4.1km，放大只是放大同一張粗網格、呈塊狀，非相機問題而是解析度問題。**本專案為面試作品，LOD 為首選方向**（展示設計思維＋可講取捨）。完整方案光譜、工時估算、面試講稿骨架已整理成筆記 → [docs/notes/lod-terrain-design.md](docs/notes/lod-terrain-design.md)。摘要：
		- 方案 D Production 完整版（五子系統或 3D Tiles/Cesium）：~2~4 週，對固定小範圍冰島屬過度工程。
		- **方案 B Chunked LOD MVP（推薦）**：真 tiling（quadtree-lite 3 層）＋依相機距離全域單層級選層＋TileCache 懶載；砍掉 frustum culling／接縫縫合／LRU（全域單層級天然無縫）。~2.5~3 天。可選加 L3（等效 512）跨 2 天拓資料。
		- 方案 C 偽 LOD（3 張整島 heightmap 128/256/512 依距離切換）：~1 天，但難稱作 LOD。
		- 方案 A 單一網格提高解析度（256/512）：~0.5~1 天，非 LOD 基準線。
		- 待定：切幾層（L0~L2 / L0~L3）、切層體驗（瞬間／淡入），詳見筆記。
		- 時點：**Phase 2-2 測站點位做完後**再實作；會改寫地形架構（Terrain→TerrainLOD+TerrainTile+TileCache），blast radius 大，需最小步逐 tile 驗證。

### 2-2 InstancedMesh 即時點位渲染
- 狀態：完成（2026-07-02）
- 產出（依最小步逐步）：
	- 2-2a 共用座標映射 [src/lib/map/coords.ts](src/lib/map/coords.ts)：`ICELAND_BBOX`（與 fetch-dem 同值，單一真相源）、`computePlaneDepth()`、`lonLatToSceneXZ(lon,lat)→{x,z}`；node 驗證雷克雅未克/阿克雷里/赫本落點方位與四角皆正確、planeDepth≈27.84 與 Terrain 一致。
	- 2-2b 測站點位 [src/components/map/StationLayer.tsx](src/components/map/StationLayer.tsx)：InstancedMesh 一次 draw call 畫全部測站，matrix 用 useMemo+useLayoutEffect 預算；資料由 [MapCanvas.tsx](src/components/map/MapCanvas.tsx) 以 prop 傳入（R3F Canvas 是獨立 render root、context 不穿透）。
	- 2-2c 貼地形表面：coords 加共用高度公式 `computeKmPerUnit()`/`elevationToSceneY(m)`/`sampleElevationMeters(hm,lon,lat)`（與 Terrain 同一條換算）；heightmap 讀取抽成 hook [src/lib/map/use-heightmap.ts](src/lib/map/use-heightmap.ts)（收斂技術債 #5）；測站 Y＝地表高度＋半徑＋偏移，坐在地表上。
	- 2-2d 風險配色：依 `alertLevel`（low 綠/medium 琥珀/high 紅）用 `setColorAt` 寫 instanceColor 逐站上色，取代除錯亮橙。
- 驗收結果：
	- 每步 `get_errors` 無誤、`corepack pnpm lint` 通過、home 200；本批動共用型別/模組，`corepack pnpm build` 成功。
	- node 取樣驗證：內陸站高（冰川 1648m→Y3.12）、低地站貼海平面；沿海站在 128 粗網格（~4km）最近格點偶落海被夾平（已知限制，解析度提高後改善）。
- 技術債（本階段新增）：`VERTICAL_EXAGGERATION`/`SEA_FLOOR_UNIT` 目前 Terrain 與 coords 各有一份同值常數，尚未收斂單一真相源（已於 coords.ts 註記，須保持同值）。
	- **已收斂（2026-07-02）**：Terrain 改用 coords 的共用常數/函式（`PLANE_WIDTH`/`computePlaneDepth()`/`elevationToSceneY()`）與 `useHeightmap` hook，高度常數只存 coords 一份；Terrain 僅保留專屬 `elevationToColor` 色帶。地形與測站真正共用同一套 bbox/尺度/高度公式（單一真相源）。lint/home 200/build 皆通過、視覺不變。

### 2-3 2D/3D 聯動時間軸
- 狀態：進行中
- 產出：
	- **2-3a 光影 preset 基礎完成（2026-07-07）**：
		- 型別：新增 `LightingPresetId` / `LightingPreset`（[src/types/domain.ts](src/types/domain.ts)）。
		- 設定：新增三組 preset（`realistic` / `cinematic` / `seasonal`）與預設值（[src/lib/config/app.ts](src/lib/config/app.ts)）。
		- 渲染：`Lighting` 改為由 preset 參數驅動，維持同一渲染邏輯只切參數（[src/components/map/Lighting.tsx](src/components/map/Lighting.tsx)）。
		- 內部切換入口：新增 `INTERNAL_LIGHTING_PRESET_OVERRIDE`，可先不用 UI 驗證樣式（[src/lib/config/app.ts](src/lib/config/app.ts)）。
		- UI 切換：ControlPanel 新增下拉選單，接 `workspace` store 的 `lightingPresetId`（[src/components/panel/ControlPanel.tsx](src/components/panel/ControlPanel.tsx)、[src/lib/store/workspace.ts](src/lib/store/workspace.ts)）。
		- 一致性：`MapCanvas` debug 顯示改為與實際 active preset 同步（[src/components/map/MapCanvas.tsx](src/components/map/MapCanvas.tsx)）。
		- override 優先序：`INTERNAL_LIGHTING_PRESET_OVERRIDE` > UI 選擇 > 預設值。
	- **2-C1 光影體感 + 可分享連結（2026-07-10）**：
		- C1-1 平滑過渡：`Lighting` 新增 `useFrame + ref` 插值路徑，僅在 preset 切換時平滑過渡；時間軸驅動的光照更新維持即時（[src/components/map/Lighting.tsx](src/components/map/Lighting.tsx)）。
		- C1-2 preset URL 同步：`ControlPanel` 新增 query `preset` 與 store 雙向同步，支援分享連結與重整保留；無效值回退 `realistic`（[src/components/panel/ControlPanel.tsx](src/components/panel/ControlPanel.tsx)）。
		- C1-3 同步迴圈修正：改為 store 單主控、URL 鏡像同步；URL->store 僅處理外部導覽差異，store->URL 以 `history.replaceState` 寫入，避免 `router.replace` 導覽鏈造成互相覆寫（[src/components/panel/ControlPanel.tsx](src/components/panel/ControlPanel.tsx)）。
		- 除錯紀錄：已收斂根因與修正步驟於 [docs/notes/debug-log.md](docs/notes/debug-log.md)。
- 驗收結果：
	- `get_errors` 無誤、`corepack pnpm lint` 通過、home 200。
	- 因本步涉及 config/type/store，`corepack pnpm build` 通過。
	- commit：`e2dd104`（`feat(lighting): add preset selector wiring (phase 2-3)`）。
	- C1-1 驗證：`get_errors` / `corepack pnpm lint` 通過；當下 dev server 未啟動，home `000`（功能驗證已人工確認後再續做 C1-2）。
	- C1-1 commit：`36eb0d0`（`feat(map): smooth lighting preset transition (phase 2-c1-1)`）。
	- C1-2 驗證：`get_errors` / `corepack pnpm lint` / home 200 全數通過。
	- C1-3 驗證：`get_errors` / `corepack pnpm lint` / home 200 全數通過。

### 2-4 行動端手勢隔離
- 狀態：暫緩（主線先以桌機互動為主）
- 產出：
- 驗收結果：

---

## Phase 3：測試、上線與營運（3~5 天）

### 3-1 測試策略
- 狀態：待辦
- 產出：
- 驗收結果：

### 3-2 效能與壓力測試
- 狀態：待辦
- 產出：
- 驗收結果：

### 3-3 CI/CD 上線策略
- 狀態：待辦
- 產出：
- 驗收結果：

---

## Phase 4：AI 智慧規劃（4~6 天）

### 4-1 AI 行程生成
- 狀態：待辦
- 產出：
- 驗收結果：

### 4-2 AI 結果轉 3D 錨點
- 狀態：待辦
- 產出：
- 驗收結果：

### 4-3 Web Worker 路徑校準
- 狀態：待辦
- 產出：
- 驗收結果：

---

## 功能級紀錄（按鈕/元件專用）

### 功能：飛到景點按鈕
- 所屬 Phase：2-3
- 狀態：待辦
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
