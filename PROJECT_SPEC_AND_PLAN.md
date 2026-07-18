# Iceland Insight 專案規格與計畫書

> 文件角色：主規格與里程碑計畫（需求與範圍權威版本）
> 
> 維護規則：需求或時程變更時優先更新本檔，再同步進度紀錄檔

版本：v1.0  
日期：2026-06-17  
狀態：草稿（可直接作為開發基線）

---

## 1. 專案目標與範圍

### 1.1 產品目標
打造一個結合 3D 地形視覺化、即時天氣/道路監控、AI 行程建議的 Web SaaS，協助使用者在冰島極端氣候下進行安全且可執行的旅遊決策。

### 1.2 MVP 範圍（第一版）
- 地圖範圍：冰島南岸優先（雷克雅維克 → 維克）
- 核心功能：
  1. 3D 地形與景點點位可視化
  2. Weather + Road 即時資料聚合與風險標記
  3. AI 一日行程建議 + 可點擊 3D 錨點跳轉
  4. API 失效時自動 fallback（歷史/Mock）

### 1.3 非目標（MVP 暫不做）
- 多國家地圖支援
- 使用者社群功能
- 複雜帳單/訂閱系統

---

## 1.4 開發大方向（五步驟）

1. **確認環境與套件**：確認 Node 版本、安裝 Next.js / Three.js / Zustand / Vercel AI SDK 等必要套件，確保本機與部署環境一致
2. **API 可行性確認**：先呼叫 Vedur 與 Road API，確認回傳欄位、授權限制、rate limit 與資料穩定性，再決定資料契約
3. **建立專案架構**：建立資料夾結構、TypeScript 型別、Zod schema 與 mock fixture，讓前後端有共同基礎
4. **基礎邏輯優先，逐步擴展**：先跑通核心流程（取資料 → 3D 場景顯示 → AI 生成行程 → 飛到景點），再做效能優化與完整功能
5. **完成與驗收**：通過 E2E 測試、效能測試與手機端驗證後部署

---

## 1.5 UI 模擬圖說明（Wireframe）

> 以下為介面設計模擬圖，作為前端元件開發的視覺參考基線

> 背景冰島地圖需求：需支援縮放、拖曳與點擊互動；點擊景點後可顯示資訊或觸發相機飛行

```
┌─────────────────────────────────────────────────────────┐
│  Navbar：登入 / 登出 / 調整時間 / ...                    │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│  左側面板     │         3D 冰島地圖（主畫面）           │
│  ─────────    │                                         │
│  天氣資訊     │   ← 可旋轉/縮放/飛行的 3D 地形          │
│  交通資訊     │   ← 天氣/道路點位疊加（InstancedMesh）  │
│  AI 建議 ...  │   ← AI 行程錨點（可點擊飛行）           │
│               │                                         │
├───────────────┴─────────────────────────────────────────┤
│  底部：天氣資訊摘要 ｜ 時間軸（可拖拽）                  │
└─────────────────────────────────────────────────────────┘
```

**各區塊對應 Phase**
| 區塊 | 說明 | 對應 Phase |
|------|------|------------|
| Navbar | 登入狀態、時間選擇器 | Phase 0 |
| 左側面板 | 天氣、道路、AI 行程卡片 | Phase 1 + Phase 3 |
| 3D 地圖 | 地形、點位、錨點 | Phase 2 |
| 底部時間軸 | 拖拽聯動 3D 場景光影 | Phase 2-3 |

---

## 1.6 預期網頁內容總結

這個網站的核心內容會是一個結合 3D 地圖、即時資料面板、時間軸控制與 AI 規劃功能的互動式平台。畫面主體是一個可縮放、可拖曳、可點擊的 3D 背景地圖，使用者可以在地圖上查看不同位置的資訊點，並透過點擊操作切換視角或顯示細節內容。

網站左側會提供資訊與控制面板，用來顯示即時狀態、風險提示、路況資訊與 AI 建議內容；底部則會有時間軸，讓使用者可以拖動時間來改變畫面中的顯示狀態。整體網站會以「即時資訊 + 互動地圖 + AI 輔助決策」為主軸，讓使用者能夠在同一個頁面中完成瀏覽、判斷與規劃。

從內容結構來看，網站會包含以下幾個部分：
- 3D 背景地圖與可互動點位
- 即時天氣與路況資訊區塊
- AI 行程建議與提示區塊
- 可拖曳時間軸控制列
- 點擊後顯示的景點或位置資訊卡
- 狀態回饋與 fallback 提示機制

整體風格會偏向資訊儀表板與互動式地圖的結合，而不是單純的靜態旅遊介紹頁。

---

## 2. 技術規格

### 2.1 架構總覽
- 前端：Next.js (App Router), React, Three.js, @react-three/fiber, Zustand
- 後端：Next.js Route Handlers 作為 BFF
- 快取：Upstash Redis（Phase 1 加入）
- AI：Vercel AI SDK（串流）（Phase 3 加入，MVP 暫不做）
- 部署：Vercel
- Package Manager：pnpm
- 地形底圖：Three.js mesh + NASA 衛星圖 texture（B 方案，公開免費）
- 極光資料：NOAA SWPC JSON（納入 MVP，無需 API key）
- 路況來源：由 Vedur 天氣欄位推算（無獨立路況 API），推算邏輯見 docs/api/iceland-traffic-api.md
- 未來擴充：Supabase（Auth + PostgreSQL），用於 CRUD 使用者行程，Phase 3 後加入

### 2.1.1 地圖互動要求
- 背景冰島地圖需支援縮放、拖曳與點擊
- 點擊地圖上的景點或錨點時，需能顯示資訊卡或觸發相機飛到目標位置
- 行動端需保留基本雙指縮放與單指點擊操作

### 2.2 核心資料模型（TypeScript）

```ts
export type GeoPoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationM?: number;
  kind: 'poi' | 'weather-station' | 'road-segment';
};

export type WeatherConditions = {
  source: 'vedur';
  timestamp: string; // ISO8601
  lat: number;
  lon: number;
  temperatureC: number;
  windSpeedMs: number;
  visibilityKm?: number;
  precipitationMm?: number;
  alertLevel: 'low' | 'medium' | 'high';
};

export type RoadSegment = {
  source: 'road';
  segmentId: string;
  name: string;
  status: 'open' | 'caution' | 'closed';
  reason?: string;
  updatedAt: string; // ISO8601
  geometry: Array<[number, number]>; // [lon, lat]
};

export type ItineraryItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  waypoint: { lat: number; lon: number };
  riskNote?: string;
};

export type AuroraConditions = {
  source: 'noaa';
  observationTime: string; // ISO8601
  forecastTime: string;    // ISO8601
  coordinates: Array<[number, number, number]>; // [lon, lat, intensity 0-100]
};
```

### 2.3 BFF API 規格

#### API 端點
- `GET /data/iceland-status`

#### 查詢參數
- `region`: `south | west | north | east | all`
- `at`: ISO datetime（可選，預設 now）

#### 回應（200）
```json
{
  "meta": {
    "region": "south",
    "generatedAt": "2026-06-17T10:00:00.000Z",
    "cache": "hit",
    "fallback": false
  },
  "weather": [],
  "roads": [],
  "aurora": [],
  "summary": {
    "riskScore": 42,
    "highRiskSegments": 3
  }
}
```

#### Error 格式
```json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Vedur API unavailable",
    "fallback": true
  }
}
```

### 2.4 前端效能規格（SLO）
- 首屏（LCP）：< 3.0s（4G 中階手機）
- 3D 互動 FPS：>= 45（手機） / >= 60（桌機）
- 資料刷新延遲：< 5s（含快取命中）
- 地圖記憶體上限：< 450MB（桌機瀏覽器）

### 2.5 可靠性與防禦規格
- Upstash 快取 TTL：900 秒
- Circuit Breaker：連續 5 次上游失敗即開啟，60 秒後半開測試
- Fallback 順序：Redis stale cache → 靜態 snapshot → Mock data
- 觀測性：Sentry + 結構化日誌（requestId, source, latency, cacheState）

### 2.6 資安與金鑰管理
- 外部 API key 只存於 server env，不暴露前端
- BFF 加上 IP rate limit（例如每 IP 每分鐘 60 次）
- 啟用基本輸入驗證（region/at 參數）避免濫用

---

## 3. 分階段計畫（每項含解決方案）

## Phase 0：專案啟動（2~3 天）

### 計畫項目 0-1：建立 monorepo / app 結構
- 目標：初始化 Next.js + TypeScript + lint + format
- 解決方案：
  1. 建立 `app/`, `src/`, `workers/`, `lib/`, `types/`, `docs/`
  2. 設定 ESLint + Prettier + strict tsconfig
  3. 建立 `.env.example`、`README`、部署腳本
- 交付物：可啟動專案與基礎 CI

### 計畫項目 0-2：資料契約落地
- 目標：讓前後端先對齊資料形狀
- 解決方案：
  1. 實作 `types/domain.ts`
  2. 建立 Zod schema 驗證 BFF 回傳
  3. 製作 mock fixture（normal / degraded / failure）
- 交付物：`types` + `schemas` + `fixtures`

---

## Phase 1：BFF 與資料層（4~6 天）

### 計畫項目 1-1：Vedur + Road API 聚合
- 目標：統一資料來源並標準化輸出
- 解決方案：
  1. 建立 `lib/adapters/vedur.ts`、`road.ts`
  2. 轉換為統一 domain model
  3. 增加重試與 timeout（例如 3s timeout, retry 2）
- 交付物：`GET /data/iceland-status` 可穩定返回統一 JSON

### 計畫項目 1-2：快取與斷路器
- 目標：抗 API 波動與降成本
- 解決方案：
  1. 導入 Upstash Redis
  2. 對 region 分桶快取鍵（`status:{region}:{timeslot}`）
  3. 實作 circuit breaker state machine
- 交付物：cache hit、stale、fallback 皆可觀測

### 計畫項目 1-3：觀測與告警
- 目標：快速定位故障
- 解決方案：
  1. 接入 Sentry
  2. 每次請求寫入 requestId 與 latency
  3. 設定 API 失敗率告警（如 5 分鐘 > 10%）
- 交付物：可追蹤異常與錯誤分布

---

## Phase 1.5：最小可用網站（前後端串接 + 部署）（1~2 天）

> 調整理由（2026-06-25）：後端與資料層已完成且扎實，但前端為 0、且尚未部署過。
> 先以「簡易面板驗證前後端串接 → 立即部署」取得**最基礎可上線版本**，再進入較重的 3D（Phase 2）。
> 目的：把已累積的後端價值轉成可見、可上線成果，並提早暴露部署環境問題。

### 計畫項目 1.5-1：前端最小資料面板
- 目標：用最簡單的 React 呈現 `GET /data/iceland-status`，驗證資料契約真的好用
- 解決方案：
  1. 首頁串接 BFF，顯示天氣 / 路況摘要卡片（對應 wireframe 左側面板）
  2. 提供 region 切換（south/west/north/east/all）做最基本互動
  3. 呈現 loading / error / fallback 狀態（對應 meta.cache、fallback）
- 交付物：開啟網站即可看到真實冰島天氣 / 路況資料

### 計畫項目 1.5-2：走骨架部署（Vercel）
- 目標：先讓最小版本真正上線，提早暴露環境差異
- 解決方案：
  1. 連結 GitHub repo 至 Vercel，設定必要環境變數
  2. 確認 build script（sharp / sentry-cli）與 pnpm 版本在雲端可過
  3. 驗證線上 `GET /data/iceland-status` 與首頁可正常運作
- 交付物：可公開存取的最小網站 URL（含真實資料）

---

## Phase 2：3D 地圖與互動 UI（主線已收斂；後續以穩定版展示優化為主）

> 執行順序備註（2026-07-18）：2-1~2-3 主線已完成並收斂為穩定展示基線；2-4 行動端手勢隔離暫緩（目前以桌機體驗為主）。
> 策略收斂備註（2026-07-17）：停止 Spot LOD / 跨解析度局部幾何重建實驗，主畫面固定為 `512 DEM + 512 landcover`；景點模式保留於相機轉場與敘事用途，不再承擔地形重建責任。

### 計畫項目 2-1：3D 場景與地形基線
- 狀態：完成（已收斂為固定解析度穩定版）
- 目標：建立可順暢瀏覽的冰島 3D 場景
- 解決方案：
  1. 先上低精度 DEM + 簡化網格
  2. 以真實 DEM / landcover 建立固定解析度展示基線
  3. 透過動態載入與場景切分控制首屏負擔
- 交付物：可旋轉/縮放/移動且不卡頓的穩定版 3D 場景

> 註：LOD 曾作為「放大區域更清晰」的探索方向，但因跨解析度對位與 landcover 綁定問題已封存；若未來重啟，需先建立離線對齊驗證流程，再回到執行層。

### 計畫項目 2-2：InstancedMesh 即時點位渲染
- 狀態：完成
- 目標：數千點位下保持高 FPS
- 解決方案：
  1. 天氣與道路點位改用 InstancedMesh
  2. 顏色/狀態映射由 shader 控制
  3. 定時更新 buffer，避免 React re-render 洪水
- 交付物：高密度資料渲染穩定

### 計畫項目 2-3：2D/3D 聯動時間軸
- 狀態：主線必做（已完成，2026-07-09 驗收通過）
- 目標：一天（24 小時）時間軸可自動播放，且 2D/3D 顯示與 API 資料在同一時間語意下同步更新
- 解決方案：
  1. Zustand 單一狀態源 `selectedTime` + `playbackState`（playing/paused/speed）
  2. 時間軸預設顯示 24 小時視窗，支援自動播放、暫停、拖曳定位、回到現在
  3. 時間變更時，以同一個 `selectedTime` 驅動 2D 面板與 3D 點位，確保 API 請求與畫面一致
  4. API 更新策略：以時間槽（例如每 1h）取樣；切槽才請求，槽內以前一筆資料維持，避免過度請求
  5. fly-to 動畫做 debounce，避免拖曳時相機抖動
- 交付物：可視化時間推進、2D/3D 同步更新、資料時間與畫面時間一致
- 估時：3.5~6.5 天（含基本播放器控制與 API 同步策略）

### 計畫項目 2-4：行動端手勢隔離
- 狀態：暫緩（主線先以桌機互動為主）
- 目標：避免 2D 面板與 3D 手勢衝突
- 解決方案：
  1. UI 面板層設置 pointer-events 策略
  2. 事件邊界 `stopPropagation` + passive listener 調整
  3. 在 iOS Safari 實機驗證
- 交付物：手機可穩定操作

### Phase 2 後續優化（已收斂）

- 策略：以穩定版交付、可觀測性與展示完整度為優先；視覺提升優先走鏡位、光影、材質與互動敘事，不再以即時地形重建作為主線。
- 現況：C-1 已完成；B（LOD 強化）實驗已封存；A、C-2 若要續做，定位為展示優化與驗證收斂，而非地形架構主線。
- 銜接規則：Phase 2 主線收斂後，先進入 3-2 效能與壓力測試建立基線，再補齊 3-1 與 3-3 的工程防線。

#### 選配 C-1：光影體感 + 可分享連結（優先）
- 狀態：完成
- 目標：用最短工時提升場景體感與展示可分享性
- 方案：
  1. preset 切換平滑過渡（光強/色彩內插）：0.5~1 天
  2. preset URL 同步（可分享連結）+ reset to realistic：0.5~1 天
- 備註：已作為第一個展示強化項目落地，後續只需補 before/after 記錄與效能基線

#### 選配 B：LOD 強化
- 狀態：封存（2026-07-17 收斂）
- 原始目標：放大場景時保留地形細節並控制效能
- 封存原因：DEM 與 landcover 必須同解析度、同 bbox、同取樣規則一對一綁定；跨解析度局部放大已驗證存在對位風險，不適合以執行期參數微調硬修
- 後續條件：若未來重啟，須先建立離線資料對位驗證流程，再評估是否恢復為正式開發線

#### 選配 A：雲層視覺
- 狀態：待定（可做，但不再依附 LOD 順序）
- 目標：提升天氣語意與場景氛圍
- 方案：
  1. 基礎版（純視覺雲層）：0.5~1 天
  2. 聯動版（雲層受天氣欄位驅動，與時間軸同步）：1.5~3 天
- 建議：在效能基線建立後再決定是否納入，避免新增視覺噪音干擾穩定版驗證

#### 選配 C-2：季節日照映射 + 驗證收斂
- 狀態：待定（偏驗證/收斂型工作）
- 目標：收斂光影模型的季節語意與可測性
- 方案：
  1. seasonal 日照長短映射（夏長日/冬短日）+ 當前 preset 標示：1~2 天
  2. `computeLighting` 單元測試 + internal override 僅 dev 生效：0.5~1 天
- 建議：可與 Phase 3-1 測試策略一起規劃，讓視覺語意與可測性同時收斂

---

## Phase 3：測試、上線與營運（3~5 天）

> 時機說明：Phase 2 主線已收斂，現階段優先工作是建立穩定版效能基線、補齊測試與上線防線，再決定是否追加展示型優化，最後進入 AI 功能擴張。

### 計畫項目 3-1：測試策略
- 目標：確保穩定性與可回歸
- 解決方案：
  1. 單元測試：資料轉換、風險分數、時間軸 reducer
  2. 整合測試：BFF 聚合 + fallback 路徑
  3. E2E 測試：核心旅程（選時段→看風險→生成行程→飛景點）
- 交付物：CI 綠燈可發版

### 計畫項目 3-2：效能與壓力測試
- 目標：先驗證效能上限再開放用戶
- 解決方案：
  1. Lighthouse + Web Vitals
  2. 模擬高頻資料更新（例如每 10 秒）
  3. 針對低階手機做 FPS/記憶體量測
  4. 固定 512 DEM + 512 landcover 基線下的光影 / 點位 / 相機互動 before/after 對比量測（FPS、記憶體、互動延遲）
- 交付物：效能報告與優化清單

### 計畫項目 3-3：CI/CD 上線策略
- 目標：避免壞版直上正式環境
- 解決方案：
  1. Vercel preview + PR check gate
  2. `main` 需通過 build/test/lint 才部署
  3. 建立 rollback 指南（上一版一鍵回退）
- 交付物：可控部署流程

---

## Phase 4：AI 智慧規劃（4~6 天）

> 時機說明：待 Phase 3 穩定性與效能基線建立後再導入 AI，避免在未收斂底盤上疊加新變數。

### 計畫項目 4-1：AI 行程生成
- 目標：輸入偏好後得到可執行行程
- 解決方案：
  1. Vercel AI SDK 串流輸出
  2. System Prompt 限制「安全優先」與地理範圍
  3. 回傳結構化 JSON（地點、時間、風險備註）
- 交付物：可渲染於 UI 的 itinerary

### 計畫項目 4-2：AI 結果轉 3D 錨點
- 目標：文字建議可直接操控地圖
- 解決方案：
  1. NER/規則比對景點名稱
  2. 查表映射到 `GeoPoint.id`
  3. 生成「飛到景點」互動按鈕
- 交付物：AI 回答可直接驅動相機

### 計畫項目 4-3：Web Worker 路徑校準
- 目標：重計算不阻塞主執行緒
- 解決方案：
  1. 將地理路徑校正與風險評分搬進 worker
  2. 主線程以 message channel 接收結果
  3. 超時 fallback 至簡化路徑
- 交付物：UI 操作保持流暢

---

## 4. 里程碑與時程（建議，含主線/選配）

- Week 1（已完成）：Phase 0 + Phase 1（完成可用 BFF）+ **Phase 1.5（最小可用網站上線）**
- Week 2~3（已完成主線）：Phase 2 主線（3D 地形、測站點位、時間軸與日照模型已收斂；2-4 行動端手勢隔離暫緩）
- Week 4：Phase 2 穩定版收斂（C-1 完成、LOD 實驗封存）+ Phase 3-2 效能壓測
- Week 5：Phase 3（3-1 測試策略 + 3-3 CI/CD 上線防線）+ 視覺優化是否續做的決策點
- Week 6：Phase 4（AI 規劃與 3D 錨點）

主線工期：4~5 週（單人全端）

若納入選配：
- 加雲層聯動版：+1.5~3 天
- 加光影增強：+1.5~4 天（依是否含 seasonal 映射）

> 總工期約 4~5 週（單人全端，主線）；若含選配可增至約 5~6 週。若多人並行可壓縮至 2~3 週（主線）。
> 註：Phase 1.5 為 2026-06-25 新增的里程碑，先取得最基礎可上線版本再進 3D。

---

## 5. 風險清單與對策

1. 上游 API 不穩定  
   - 對策：快取 + 斷路器 + snapshot fallback

2. 3D 載入過重導致手機卡頓  
  - 對策：固定 512 DEM + 512 landcover 基線、instancing、延後載入、效能預算警戒

3. AI 建議與真實道路/天氣衝突  
   - 對策：行程輸出前做風險規則校驗（rule guard）

4. 資料授權與商用限制  
   - 對策：在 Phase 0 完成資料授權盤點與法務備忘錄

---

## 6. 立即執行清單（Next 5 Actions）

1. （已完成）2-3 主線播放器：24 小時時間軸自動播放（play/pause/speed/scrub）
2. （已完成）時間槽 API 同步策略：`selectedTime` 與 BFF 請求同語意（切槽才請求）
3. （已完成）2D/3D 聯動：面板摘要、測站點位、相機行為都由同一時間源更新
4. （已完成）選配 C-1：光影平滑過渡 + preset URL 同步
5. 執行 3-2 效能與壓力測試：建立固定 512 DEM + 512 landcover 的 FPS / 主執行緒 / 記憶體基線
6. 補齊 3-1 測試策略：先定義資料轉換、fallback 路徑、光影邏輯的最小測試集
7. 補齊 3-3 CI/CD 上線防線：確認 preview gate、build/test/lint 條件與 rollback 指南
8. 視效加強決策：依壓測結果決定是否續做 A（雲層視覺）或 C-2（季節日照映射 + 驗證收斂）

---

## 7. 驗收定義（DoD）

- 使用者可在 3D 地圖上查看天氣與道路風險
- 可輸入偏好並生成至少一條可執行一日行程
- API 故障時系統可自動 fallback，不白屏
- 核心流程 E2E 通過；行動端互動暫緩，以桌機體驗驗收為主
