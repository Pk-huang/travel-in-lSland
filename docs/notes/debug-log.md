# Debug Log

用途：集中記錄本專案所有除錯紀錄，避免每次問題各自散落成單獨檔案。主進度檔只保留摘要與連結，完整脈絡統一收在此處。

---

## 2026-07-10 光影 preset URL 同步迴圈

### 問題現象

- 切換光影 preset（例如 realistic -> cinematic）時，畫面來回切換，瀏覽器出現持續重複更新。
- URL query `preset` 與 UI 下拉值互相覆寫，導致看似無限迴圈。

### 根因

- `ControlPanel` 同時存在兩個 effect：
  - URL -> store：看到不一致就 `setLightingPresetId`
  - store -> URL：看到不一致就 `router.replace`
- 一次 UI 切換會先改 store，再改 URL；URL 尚未更新完成前，URL -> store effect 可能讀到舊值並把 store 拉回。
- 兩邊都主動修正對方，形成互相搶寫。

### 修正策略

- 採單主控：store 是唯一真相源，URL 只做鏡像。
- URL -> store 僅處理外部導覽（貼連結 / 手改 query / 上下頁）時的同步。
- store -> URL 改為 `window.history.replaceState`，避免 `router.replace` 導覽流程額外觸發同步鏈。

### 實作位置

- [src/components/panel/ControlPanel.tsx](src/components/panel/ControlPanel.tsx)

### 驗證重點

1. UI 切換 preset 時，畫面應只發生一次主切換，不再來回抖動。
2. URL `preset` 會同步成相同值，且可重整保留。
3. 手動貼 `?preset=cinematic` 進站時，UI 與 store 能正確對齊。

---

## 2026-06-25 CI/CD（Vercel）部署除錯彙整

### 問題範圍

- 平台：Vercel（Next.js App Router）
- 套件管理：pnpm 11.8.0（透過 corepack）
- 症狀：本機可跑，但雲端建置失敗；錯誤訊息與 pnpm 版本差異強相關。

### 主要故障與根因

#### 1. lockfile 解析失敗

**症狀**
- Vercel 端解析 `pnpm-lock.yaml` 失敗，安裝階段即中止。

**根因**
- 曾使用 `devEngines.onFail: download`，導致 lockfile 寫入 `packageManagerDependencies` / `@pnpm/exe`（pnpm-11 特定欄位）。
- 雲端解析策略與本機狀態不一致時，會在 install 前失敗。

**解法**
- 移除 `devEngines` 該設定。
- 重新生成 lockfile，確保 lockfile 與部署端可解析。

#### 2. `ERR_PNPM_IGNORED_BUILDS`（CI exit 1）

**症狀**
- 本機通常只警告，但 CI/Vercel 直接失敗。
- 受影響套件如 `@sentry/cli`、`sharp`、`unrs-resolver`（含 build scripts）。

**根因**
- pnpm v11 安全模型要求對 build scripts 顯式表態。
- 舊鍵（`onlyBuiltDependencies` / `ignoredBuiltDependencies` 等）在 v11 已移除或不再生效。
- `package.json` 的 `pnpm` 欄位在此情境不再作為可信來源。

**解法**
- 使用 `pnpm-workspace.yaml` 的 `allowBuilds`（v10.26+）明確宣告允許/拒絕。
- 不再使用舊鍵名，避免看似設定了但實際無效。

#### 3. `pnpm-workspace.yaml` 重複鍵造成 YAML 解析失敗

**症狀**
- 安裝錯誤後，下一次直接因 YAML 重複鍵失敗。

**根因**
- 某些失敗流程後，workspace 檔案可能殘留/插入 placeholder `allowBuilds:` 區塊。
- 與手寫區塊並存後形成 duplicate key。

**解法**
- 合併為單一 `allowBuilds` 區塊。
- 每次修改後先跑 YAML 檢查與 `pnpm install --frozen-lockfile` 預演。

### 已驗證可行的部署前預演

```bash
rm -rf node_modules
CI=1 corepack pnpm install --frozen-lockfile
corepack pnpm build
```

以上在本專案可通過，且與 Vercel 流程一致度高。

### 快速排查清單（建議固定流程）

1. 先確認 `packageManager` 鎖定 pnpm 版本（例如 `pnpm@11.8.0`）。
2. 檢查 `pnpm-workspace.yaml`：只保留一個 `allowBuilds`。
3. 不使用 pnpm v11 已淘汰鍵名（避免假設定）。
4. 以 `CI=1 ... --frozen-lockfile` 在本機預演安裝。
5. `corepack pnpm build` 通過後再 push。

### 補充：與本地沙盒權限錯誤的區別

- 本地開發工具曾出現 `EPERM ... ~/.cache/node/corepack`，這是「執行沙盒權限」問題，
  不是 CI/CD 管線配置錯誤。
- CI/CD 章節聚焦於 Vercel 建置失敗（lockfile / pnpm 設定 / YAML 配置）三類根因。

---

## 2026-07-08 日照模型閃爍除錯

### 問題現象

- 使用者在 07/08 10:00 ~ 11:36 拖動時間軸時，觀察到光照偶發「突然變亮又立刻變暗」。
- 右上角 debug 值可見 `day` 與 `sun` 在短時間內大幅跳動。
- 視覺感受不是太陽方向跳躍，而是亮度短促尖峰。

### 初始架構

當時前端 `Lighting` 內同時存在兩條光照計算路徑：

1. `daylightFromSun`
- 依第三方 sunrise / sunset / twilight 邊界計算

2. `fallbackDaylight`
- 依系統時間的舊正弦公式近似白天夜晚

設計初衷是保底容錯：
- 有第三方資料時，逐步接到真實日照
- 第三方資料失效時，仍能退回近似模型，避免白屏或整體失真

但這兩條路徑在資料可用時仍被混合，成為後續閃爍的根因。

### 除錯時間線

#### 1. 獨立接入第三方日照資料

- 新增獨立路由 `/data/sun-times`
- 新增第三方 client：Sunrise-Sunset API
- 新增型別與 schema，驗證上游回傳欄位

目的：先確認第三方日照資料本身可穩定取得，而不是直接混進既有 BFF 難以分辨問題來源。

#### 2. 併入 BFF 並建立三天邊界

- 將 `sun` 併入 `/data/iceland-status`
- 擴充成三天邊界：`previous / current / next`
- 目標是支援跨午夜連續插值，避免 23:59 → 00:01 方向斷裂

#### 3. 前端改吃三天邊界

- `Lighting` 改為優先使用 `sunBoundary`
- 以 sunrise / sunset / civil twilight 推導 `daylight` 與 `sunAngle`
- `MapCanvas` debug 同步走同一條計算路徑

#### 4. 使用者回報日出日落仍有閃爍

觀察結果：
- 閃一下是亮度瞬間升高再降低
- 比較不像太陽方向錯誤，較像輸入值在切換

#### 5. 加入追蹤日誌

在 [src/components/map/Lighting.tsx](src/components/map/Lighting.tsx) 加入 threshold-based debug log：

- `daylightFromSun`
- `fallbackDaylight`
- `contextSource`
- `legacySunAngle`
- `targetSunAngle`
- 跳變前後的 `daylight / sunIntensity / ambientIntensity`

只有在數值跳變超過門檻時才輸出，避免 console 洗版。

#### 6. 從 log 確認根因

實際觀察到：
- `daylightFromSun` 偏低
- `fallbackDaylight` 偏高
- 同一個 `selectedTime` 會被兩套模型各算一次，再混成最終值

結論：
- 問題不是曲線函數本身錯誤
- 問題是「同一時間，同時走真實日照模型與近似 fallback 模型」
- 兩者在某些時刻差距過大，混合後產生亮度尖峰

### 根因定位

#### 表面問題

- 光照亮度偶發跳變

#### 真正原因

- 前端存在雙路模型混算
- 同一個 `selectedTime` 被兩種方法各算一次：
	- 真實日照邊界模型
	- 系統時間近似模型
- 最終做混合時，輸入差異過大造成閃爍

#### 補充說明

時間參數其實只有一個，不是有兩個時間來源。

真正有兩條的是「計算路徑」：

1. `selectedTime -> daylightFromSun`
2. `selectedTime -> fallbackDaylight`

也就是同一個時間，被兩個模型各自解讀一次。

### 修正決策

#### 決策原則

後端先決定唯一有效來源，前端只吃一條路徑，不再自己混算。

#### 新架構：單一路徑 `sunModel`

在 BFF 新增 `sunModel`：

```ts
type SunLightingModel = {
  source: "sun" | "fallback";
  tzid: string;
  boundary: SunLightingBoundary | null;
  fallbackReason?: string;
};
```

當第三方資料有效時：
- `source = "sun"`
- 後端先清洗並輸出有效邊界 timestamp

當第三方資料無效時：
- `source = "fallback"`
- 前端只走舊公式，不和 `sun` 路徑混用

#### 後端責任

- 清洗 `1970...` sentinel
- 決定有效邊界
- 補上跨午夜需要的前一天日落 / 隔天日出
- 決定 `source = sun | fallback`

#### 前端責任

- 只依 `sunModel.source` 走單一路徑
- `sun` 路徑：只用 `boundary` 計算
- `fallback` 路徑：只用近似公式計算

### 實作變更摘要

#### 後端

- [src/app/data/sun-times/route.ts](src/app/data/sun-times/route.ts)
- [src/lib/api/sun-times.ts](src/lib/api/sun-times.ts)
- [src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
- [src/types/domain.ts](src/types/domain.ts)
- [src/schemas/domain.ts](src/schemas/domain.ts)

#### 前端

- [src/components/map/Lighting.tsx](src/components/map/Lighting.tsx)
- [src/components/map/MapCanvas.tsx](src/components/map/MapCanvas.tsx)
- [src/components/timeline/TimelineControl.tsx](src/components/timeline/TimelineControl.tsx)
- [src/lib/store/workspace.ts](src/lib/store/workspace.ts)

### 驗證結果

- `get_errors`：通過
- `corepack pnpm lint`：通過
- `corepack pnpm build`：通過
- `home:200`：通過
- BFF 實測：`/data/iceland-status?region=south` 已回 `sunModel.source = sun`

### 後續觀察點

1. 重新驗證 07/08 10:00 ~ 11:36 是否仍有亮度突刺
2. 若仍有問題，下一步直接比對 `sunModel.boundary` 在特定時間的輸入值
3. 不再回頭調整雙路混合，因該根因已移除

### 一句結論

這次日照閃爍的根因不是函數曲線，而是「同一個時間被兩套模型同時計算並混合」。最終解法是把來源決策移回後端，前端只走單一路徑 `sunModel`。

---

## 2026-07-13 首頁 prerender 失敗修復

### 問題現象

- `pnpm build` 失敗，錯誤為：`Error occurred prerendering page "/"`。
- Next.js build worker 以 code 1 結束，導致部署中斷。

### 根因

- 首頁 [src/app/page.tsx](src/app/page.tsx) 為 Server Component。
- 首頁掛載的面板鏈路中， [src/components/panel/ControlPanel.tsx](src/components/panel/ControlPanel.tsx) 使用 `useSearchParams`。
- 這條 client 鏈路在首頁沒有 Suspense 邊界，導致 App Router 在 prerender `/` 時失敗。

### 修正策略

- 在 [src/app/page.tsx](src/app/page.tsx) 針對 [src/components/panel/FloatingPanel.tsx](src/components/panel/FloatingPanel.tsx) 加上 `Suspense` 邊界（`fallback={null}`）。
- 保持最小變更，不調整既有業務邏輯與 store 同步流程。

### 實作位置

- [src/app/page.tsx](src/app/page.tsx)

### 驗證結果

- `get_errors`（page 檔案）：通過
- `corepack pnpm lint`：通過
- `curl -s -o /dev/null -w "home:%{http_code}\\n" http://localhost:3000/`：`home:200`
- `corepack pnpm build`：通過，`/` 成功 prerender

### 版本資訊

- Commit: `6f9674b`
- Message: `fix(app): add suspense boundary for homepage prerender`

### 一句結論

這次 build 失敗是首頁缺少 Suspense 邊界，不是資料或型別問題；補上邊界後，lint 與 build 全部恢復綠燈。

---

## 2026-07-16 LOD 策略轉向（完整 LOD -> Spot LOD）

### 問題現象

- 進入 tile mesh 階段後，出現過 tile 缺塊、區塊順序顛倒、邊界光照不連續等問題。
- 可視清單（frustum）在臨界時可能讓可見 tile 數量過少，造成畫面看起來像被切掉。
- 若持續往完整自由漫遊 LOD 前進，工程複雜度與除錯成本快速上升。

### 根因

- 目標過大：同時追求全域自由漫遊、多層細化、接縫穩定、快取治理。
- tile 化後的座標映射與接縫法線必須高度一致，任何符號或法線策略不一致都會放大為可見瑕疵。
- 可視剔除若沒有保底策略，容易在相機臨界姿態產生閃斷感。

### 修正策略（決策轉向）

- 從「完整自由漫遊 LOD」轉為「Spot LOD（景點焦點式）」。
- 核心規則改為：
  - `No focus, no LOD.`
  - `Only active POI gets detail.`
- 目標由「全域任意縮放都細化」改為「點擊景點 -> 固定鏡位檢視 -> 焦點區域細化」。
- 與壓力測試並行，先拿固定腳本基線再決定是否加重局部 DEM 細化。

### 實作過程（本輪）

1. 先把單一地形改為 tile mesh 集合（單一解析度），建立切塊骨架。
2. 發現拚裝問題後，先回到「拚裝基線」：
   - 暫停可視剔除（全 tile 渲染）
   - 法線改為全域高度場 central difference，降低邊界不連續
3. 修正 tile 南北方向映射，解決第一塊與第三塊顛倒。
4. 重新接回可視清單，加入保底策略：最少保留中心附近 tile，避免清單歸零。

### 實作位置

- [src/components/map/Terrain.tsx](src/components/map/Terrain.tsx)
- [src/lib/map/terrain-tiles.ts](src/lib/map/terrain-tiles.ts)
- [docs/notes/lod-terrain-design.md](docs/notes/lod-terrain-design.md)

### 驗證結果（本輪反覆）

- `get_errors`：通過
- `corepack pnpm lint`：通過
- `curl -s -o /dev/null -w "home:%{http_code}\\n" http://localhost:3000/`：`home:200`

### 後續計畫

1. 先做景點模式狀態骨架（焦點景點、固定鏡位參數）。
2. 接景點 UI 點擊與 CameraRig 固定轉場。
3. 焦點觸發局部細化，未焦點一律維持基底。
4. 以景點切換流程建立壓測腳本與比較報告。

### 一句結論

這次不是單一 bug 修復，而是把技術方向從「完整 LOD」收斂成「可交付、可觀測、可壓測」的 Spot LOD 路線，保留 LOD 核心思想，同時把風險壓在可控範圍。
