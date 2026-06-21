# Iceland Insight 實作進度紀錄

更新日期：2026-06-18  
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
- 狀態：待辦
- 產出：
- 驗收結果：

### 0-2 資料契約落地
- 狀態：待辦
- 產出：
- 驗收結果：

---

## Phase 1：BFF 與資料層（4~6 天）

### 1-1 Vedur + Road API 聚合
- 狀態：待辦
- 產出：
- 驗收結果：

### 1-2 快取與斷路器
- 狀態：待辦
- 產出：
- 驗收結果：

### 1-3 觀測與告警
- 狀態：待辦
- 產出：
- 驗收結果：

---

## Phase 2：3D 地圖與互動 UI（7~10 天）

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
