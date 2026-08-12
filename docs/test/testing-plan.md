# 專案測試規劃

## 1. 規劃目標

這個專案是 side project，不需要像正式產品那樣建立完整的軟體測試流程。目標是以「功能是否能穩定使用」為核心，針對最重要的使用流程做保護，避免在日常修改後，核心功能突然失效。

## 2. 測試原則

- 只測「高價值」的功能，不把時間花在低價值細節
- 以使用者實際流程為中心，而不是以測試覆蓋率為中心
- 3D / 地圖相關功能以「煙霧測試」與「核心互動測試」為主
- 不強制每次修改都跑完整測試矩陣，重點是保護核心功能

## 3. 測試方向

目前階段以最少成本保護最重要功能為主，建議採用「少量但有價值」的測試策略。

### 測試重點與執行原則

- 離線數據與圖磚渲染 (Data & Rendering)
  - 以確認資料載入與地圖畫面是否正常為主。
  - 優先驗證離線資料時是否有基本 fallback，地圖容器與圖磚是否成功渲染。
  - 視覺細節與高精度呈現可先以手動觀察為主。

- 核心地圖功能與演算法 (Core Features)
  - 這是最值得優先自動化的部分。
  - 包含地圖是否正常初始化、POI / marker 是否可點擊、詳細內容是否打開、主要模式切換是否正常，以及 API 失敗時是否仍維持基本可用狀態。
  - 建議以 smoke test 與核心互動測試為主。

- 狀態切換與極限測試 (Stress & Edge Cases)
  - 這類情境以少量自動化為主，並搭配手動驗證。
  - 重點確認狀態切換是否穩定、錯誤 fallback 是否正常，以及極端情境下是否不會直接崩潰。
  - 長時間使用、連續操作與高負載情況可先以手動觀察為主。

## 4. 測試工具

- 單元與元件測試：Vitest + Testing Library
- API 模擬：MSW
- E2E：Playwright（只做少量 smoke test）

## 5. 判斷方法

1. 先定義預期結果
2. 依照預期結果規劃對應測試方法
3. 驗證測試方法是否能達到預期結果
4. 若測試失敗，分析原因並修正
5. 無論測試成功與否，都紀錄在這份文件中，方便後續回顧

## 6. 測試階段

### Phase 1：地圖互動測試

這一階段以「地圖是否能正常提供核心使用體驗」為核心，重點測試使用者打開地圖後最常見的互動流程。

要測的案例：
- 地圖是否正常載入
- POI / marker 是否能正常顯示
- 點擊 POI / marker 後，詳細內容是否會打開
- 主要模式切換是否正常
- API 失敗時，畫面是否還能維持基本可用狀態

需要測試的功能：
- 地圖初始化
- 主要互動事件
- 關鍵 UI 狀態切換
- 錯誤 fallback 行為

建議執行方式：
- 先以 smoke test 驗證地圖是否能成功顯示
- 再補上點擊與模式切換的核心互動測試
- 這一階段適合優先做自動化

### Phase 2：資料處理與核心流程測試

這一階段側重於資料層與流程串接，確認地圖背後的資料與狀態邏輯是否正確。

要測的案例：
- 資料轉換是否正確
- schema 驗證是否正確
- 主要流程是否能串起來
- 核心 UI 的開關、顯示、隱藏是否正常

需要測試的功能：
- 資料轉換邏輯
- schema / validation
- selector / store 邏輯
- 核心流程整合

建議執行方式：
- 以單元測試與元件測試為主
- 針對資料流與狀態更新做驗證
- 若流程已經穩定，這一階段可視情況降為定期檢查

### Phase 3：離線資料與渲染穩定性測試

這一階段針對地圖在非理想環境下的表現做確認，特別是離線資料與圖磚渲染情境。

要測的案例：
- 離線資料時是否有基本 fallback
- 圖磚或地圖內容是否仍可正常顯示
- 地圖容器是否成功建立，避免空白畫面
- 當資料缺失或 API 失敗時，畫面是否仍可保持基本可用

需要測試的功能：
- 資料異常處理
- 地圖渲染 fallback
- 基礎可用性保護

建議執行方式：
- 以少量自動化測試為主
- 視覺與高精度渲染可先以手動驗證為主

### Phase 4：Phase 3 規格缺口補強（部署、效能、營運）

根據專案規格，Phase 3 不只包含 UI 測試，還包含以下幾個重要營運面向；這些內容目前需要納入測試規劃，以避免「功能可見但工程防線不足」的狀態。

#### 4.1 BFF / 資料聚合與 fallback 路徑測試
要測的案例：
- `GET /data/iceland-status` 在正常資料、降級資料與失敗情境下的回應一致性
- fallback chain 是否依照規格順序執行：Redis stale cache → snapshot → mock
- API 失敗時前端是否仍保持基本可用，而不是直接白屏
- summary / riskScore / weather / roads 的資料契約是否保持一致

需要測試的功能：
- BFF 聚合邏輯
- schema validation
- fallback 策略
- 失敗時降級渲染

建議執行方式：
- 以整合測試為主，搭配 MSW / mock API 路徑
- 對每個 fallback 分支都保留最小可驗證案例

#### 4.2 狀態邏輯與時間軸測試
要測的案例：
- `selectedTime`、`playbackState`、`timeline` 狀態切換是否正確
- 時間軸拖曳或播放後，2D/3D 面板資料是否同步更新
- 時間槽切換時，不會因為重複請求或狀態錯亂造成錯誤渲染

需要測試的功能：
- reducer / state machine
- UI 與資料同步
- 時間軸輸出邏輯

建議執行方式：
- 以單元測試與元件測試為主
- 保留最小必測分支：播放、暫停、拖曳、回到現在

#### 4.3 效能與壓力測試
要測的案例：
- 首頁與地圖初始化時間是否符合 LCP / Web Vitals 閾值
- 高頻資料更新（例如每 10 秒）時，UI 是否仍穩定
- 低階手機環境下是否維持可用 FPS 與記憶體上限
- 固定 512 DEM + 512 landcover 基線下，互動延遲與記憶體是否有回歸

需要測試的功能：
- 3D render performance
- 地圖資料更新頻率
- 低端設備穩定性

建議執行方式：
- 以性能 smoke + 定期指標檢查為主
- 不是每次都全量壓測，而是在關鍵改動後做最小性能收斂驗證

#### 4.4 CI / CD / 發版防線
要測的案例：
- PR 時是否自動跑 `lint` / `build` / `test`
- `main` branch 是否需通過檢查才能部署
- 回歸版本是否有快速 rollback 流程

需要測試的功能：
- 發版門檻
- build 防線
- rollback readiness

建議執行方式：
- 將這些納入 CI / preview deployment 流程，而不是純手動檢查
- 以「不允許壞版直接上線」為核心原則

#### 4.5 Demo Sprint 閉環測試
要測的案例：
- POI 詳細卡顯示與圖片切換
- 旅行清單 CRUD（新增 / 編輯 / 刪除 / 完成）
- AI 建議是否可一鍵加入清單
- 清單導向的推薦排序與風險提示是否正常更新
- API 失敗時仍不白屏，Demo 可連續展示

需要測試的功能：
- POI 展示
- travel plan CRUD
- AI recommendation flow
- list-driven UI state

建議執行方式：
- 以 smoke test + 核心互動測試為主
- 以 Demo 是否可連續表演為主要驗收標準，而不是追求完美覆蓋率

## 7. 渢試確認清單

### 基本功能測試
- 地圖載入
- POI 點擊後顯示內容
- marker 點擊後顯示內容
- 模式切換
- panel 開關
- API 失敗時的 fallback
- 離線資料時的基本可用狀態

### 資料處理測試
- 資料轉換邏輯
- schema 驗證
- 狀態更新邏輯
- filter / query 邏輯
- 資料缺失或異常時的處理行為

### UI 與互動測試
- 只有核心 UI 變更時才納入自動化測試
- 低頻功能先以手動驗證為主
- 純視覺細節不優先納入自動化
- 過度細碎的邊界情境暫不列為優先項
- 需要保護的核心流程優先於裝飾性互動

### 運營與部署測試
- BFF fallback chain 是否依規格順序運作
- `lint` / `build` / `test` 是否於 PR 與 main branch 形成防線
- 離線資料與 API 失敗時是否不造成白屏
- 高頻資料更新與 Web Vitals 是否仍維持可用範圍
- Demo sprint 的 3 個核心流程是否可連續演示：POI / travel list / AI recommendation

## 8. 測試紀錄模板（整合自動化任務分類）

以下紀錄模板與自動化任務清單保持一致，所有測試都必須補上：
- 任務代號（AT-XX）
- 優先級（P0 / P1 / P2）
- 是否自動化（是 / 否）
- 測試層級（E2E / Integration / Unit / Manual）
- 測試工具

這樣做的目的是讓每一筆測試紀錄都能直接對應到執行任務清單，後續可直接交給 agent 執行，而不需要再重新整理。

### 標準格式

測試項目：
- 任務代號：AT-XX
- 優先級：P0 / P1 / P2
- 是否自動化：是 / 否
- 測試層級：E2E / Integration / Unit / Manual
- 測試工具：Playwright / Vitest / MSW / 手動驗證
- 日期：
- 預期結果：
- 實際結果：
- 是否通過：
- 備註：

### 實際紀錄範例

### 本次實際執行紀錄（AT-01 至 AT-10，2026/08/12）

測試項目：地圖載入 smoke test
- 任務代號：AT-01
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/12
- 預期結果：首頁載入成功，地圖容器與主要模式按鈕可顯示
- 實際結果：首頁成功載入，`天氣` / `景點` 按鈕可見，並且 mode 切換維持正常
- 是否通過：通過
- 備註：執行命令 `corepack pnpm exec playwright test src/e2e/smoke.spec.ts --reporter=line`，結果為 `2 passed (5.9s)`

測試項目：POI marker 顯示與點擊互動
- 任務代號：AT-02
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright + Testing Library
- 日期：2026/08/12
- 預期結果：POI 點位可顯示，點擊後可打開詳細內容
- 實際結果：目前未新增直接的 POI 點擊自動化驗證，僅有首頁與 mode smoke 路徑確認
- 是否通過：未直接驗證
- 備註：此項為核心路徑，建議後續補充明確的 POI click assertion

測試項目：weather 測站顯示與點擊互動
- 任務代號：AT-03
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/12
- 預期結果：weather mode 下測站可顯示並顯示對應資訊
- 實際結果：`mode 切換` smoke 測試已確認 weather / poi 切換 UI 正常，未額外做站點點擊驗證
- 是否通過：部分通過
- 備註：目前已確認切換路徑可用，站點選取細節可再補強

測試項目：模式切換：poi / weather / overview
- 任務代號：AT-04
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/12
- 預期結果：不同 mode 之間切換正常，UI 狀態一致
- 實際結果：mode 切換 smoke test 成功通過，景點與天氣按鈕切換後 UI 保持回應
- 是否通過：通過
- 備註：`2 passed (5.9s)` 代表主要 mode switch 路徑已驗證

測試項目：空白地圖點擊後清除選取狀態
- 任務代號：AT-05
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/12
- 預期結果：點擊空白區後清除既有 marker 選取與 focus
- 實際結果：目前未新增直接的空白地圖點擊斷言，尚未獨立驗證
- 是否通過：未直接驗證
- 備註：此項在實務上屬於重要互動，建議補一條明確的空白點擊測試

測試項目：API 失敗時 fallback 行為
- 任務代號：AT-06
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Vitest / MSW
- 日期：2026/08/12
- 預期結果：POI / weather / Iceland 狀態 API 失敗時不直接崩潰，會回退到本地資料或錯誤狀態
- 實際結果：`useFeaturedPois` 與 `useIcelandStatus` 測試均通過；失敗路徑有正確 fallback / error 記錄
- 是否通過：通過
- 備註：執行命令 `corepack pnpm exec vitest run src/lib/client/use-featured-pois.test.tsx src/lib/client/use-iceland-status.test.tsx`，結果為 `Test Files  2 passed (2)`、`Tests  5 passed (5)`

測試項目：離線資料與 fallback 資料渲染
- 任務代號：AT-07
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Vitest
- 日期：2026/08/12
- 預期結果：離線或 fallback 資料情境下，地圖與核心資料仍可保持基本可用
- 實際結果：fallback 測試已驗證 API 失敗與空回傳時回退本地 seeds，資料仍可被使用
- 是否通過：通過
- 備註：這部分覆蓋了主要 fallback 行為，但未做完整 browser-level offline 離線渲染驗證

測試項目：資料 schema 與轉換驗證
- 任務代號：AT-08
- 優先級：P0
- 是否自動化：是
- 測試層級：Unit / Integration
- 測試工具：Vitest
- 日期：2026/08/12
- 預期結果：POI / weather / status 資料符合 schema，異常資料能被處理
- 實際結果：目前已驗證 fallback / state logic，未新增獨立 schema validation 測試
- 是否通過：未直接驗證
- 備註：目前已有資料處理與 fallback 測試，但尚未覆蓋完整 schema assertion

測試項目：fallback chain 邏輯測試
- 任務代號：AT-09
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Vitest
- 日期：2026/08/12
- 預期結果：fallback 路徑依照規格順序執行，資料契約一致
- 實際結果：目前僅驗證了 hook 失敗與空資料回退，未新增完整 fallback chain sequence 測試
- 是否通過：未直接驗證
- 備註：已具備 fallback 基礎驗證，尚未補足完整鏈路測試

測試項目：selectedTime / playbackState / timeline 狀態邏輯
- 任務代號：AT-10
- 優先級：P0
- 是否自動化：是
- 測試層級：Unit
- 測試工具：Vitest
- 日期：2026/08/12
- 預期結果：播放、暫停、拖曳、回到現在等狀態切換正確
- 實際結果：目前未新增 timeline / playback 狀態測試，僅確認 marker interaction core logic
- 是否通過：未直接驗證
- 備註：此部分仍屬規劃中尚未補齊的高優先度項目

測試項目：地圖載入
- 任務代號：AT-01
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：地圖正常載入
- 實際結果：地圖正常載入
- 是否通過：通過
- 備註：n/a
 
測試項目：POI 點擊後顯示內容
- 任務代號：AT-02
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright + Testing Library
- 日期：2026/08/11
- 預期結果：POI 點擊後顯示內容正常
- 實際結果：POI 點擊後顯示內容正常
- 是否通過：通過
- 備註：鏡頭訪大動作需要調整 ui 版面在需要修正

測試項目：點擊地圖空白處後清除目前 marker 選取
- 任務代號：AT-05
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：點擊空白地圖後，已開啟的 marker 選取狀態會清除，畫面不殘留錯誤 focus
- 實際結果：點擊空白地圖後，已開啟的 marker 選取狀態清除，畫面無錯誤 focus
- 是否通過：通過
- 備註：2042u0

測試項目：POI 模式切換後顯示 POI 點位
- 任務代號：AT-04
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：切換到 poi mode 後，地圖顯示 POI 點位且可互動
- 實際結果：切換到 poi mode 後，地圖顯示 POI 點位且可互動
- 是否通過：通過
- 備註：n/a

測試項目：POI 詳細卡圖片切換
- 任務代號：AT-11
- 優先級：P1
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Testing Library / Playwright
- 日期：2026/08/11
- 預期結果：開啟 POI 詳細卡後，可正常切換上一張、下一張與指定圖片
- 實際結果：開啟 POI 詳細卡後 沒有換圖片
- 是否通過：未通過
- 備註：需修正圖片切換邏輯

測試項目：POI focus 模式只顯示單一景點
- 任務代號：AT-04
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：選取特定 POI 並進入 focus 狀態後，只顯示被選取的景點
- 實際結果：選取特定 POI 並進入 focus 狀態後，只顯示被選取的景點
- 是否通過：通過
- 備註：n/a

測試項目：weather 模式切換後顯示測站點位
- 任務代號：AT-03
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：切換到 weather mode 後，測站點位顯示正常，且不影響地圖基本操作
- 實際結果：切換到 weather mode 後，測站點位顯示正常，且不影響地圖基本操作
- 是否通過：通過
- 備註：n/a

測試項目：weather 測站點擊後顯示對應資訊
- 任務代號：AT-03
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：點擊測站後，可正確選取站點並顯示對應資訊
- 實際結果：點擊測站後，可正確選取站點並顯示對應資訊
- 是否通過：通過
- 備註：n/a

測試項目：settings panel 開關正常
- 任務代號：AT-12
- 優先級：P1
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Testing Library
- 日期：2026/08/11
- 預期結果：設定 panel 可正常打開與關閉，狀態不錯亂
- 實際結果：可正常打開與關閉，狀態不錯亂
- 是否通過：通過
- 備註：n/a

測試項目：settings panel 分頁切換正常
- 任務代號：AT-12
- 優先級：P1
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Testing Library
- 日期：2026/08/11
- 預期結果：timeline、display、lighting、detail 等分頁切換正常，且保留合理狀態
- 實際結果：timeline、display、lighting、detail 等分頁切換正常，且保留合理狀態
- 是否通過：通過
- 備註：n/a

測試項目：scene control 變更後畫面仍可用
- 任務代號：AT-13
- 優先級：P1
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright
- 日期：2026/08/11
- 預期結果：調整 display、lighting、terrain detail 等設定後，畫面維持穩定且無明顯錯誤
- 實際結果：調整 display、lighting、terrain detail 等設定後，畫面維持穩定且無明顯錯誤
- 是否通過：通過
- 備註：n/a

測試項目：POI API 成功時使用遠端資料
- 任務代號：AT-06
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：MSW + Vitest
- 日期：
- 預期結果：POI API 成功回應時，前端使用 API 資料並正常渲染內容
- 實際結果：
- 是否通過：
- 備註：

測試項目：POI API 失敗時回退本地資料
- 任務代號：AT-06
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：MSW + Vitest
- 日期：
- 預期結果：POI API 失敗時，自動回退到本地 seeds，畫面仍維持基本可用
- 實際結果：
- 是否通過：
- 備註：

測試項目：Iceland 狀態 API 失敗時維持基本可用
- 任務代號：AT-06
- 優先級：P0
- 是否自動化：是
- 測試層級：Integration
- 測試工具：MSW + Playwright
- 日期：
- 預期結果：weather 或 road 狀態資料失敗時，畫面有 fallback 或降級行為，不直接崩潰
- 實際結果：
- 是否通過：
- 備註：

測試項目：離線資料載入時地圖容器正常建立
- 任務代號：AT-07
- 優先級：P0
- 是否自動化：是
- 測試層級：E2E
- 測試工具：Playwright + MSW
- 日期：
- 預期結果：離線或 fallback 資料情境下，地圖容器可正常建立，避免空白頁
- 實際結果：
- 是否通過：
- 備註：

測試項目：travel plan marker 去重邏輯正確
- 任務代號：AT-15
- 優先級：P1
- 是否自動化：是
- 測試層級：Unit
- 測試工具：Vitest
- 日期：
- 預期結果：同一 travel day 內重複 stop 或 timeline item 不會產生重複 marker
- 實際結果：
- 是否通過：
- 備註：

測試項目：marker interaction 在 mode 切換後狀態一致
- 任務代號：AT-14
- 優先級：P1
- 是否自動化：是
- 測試層級：Integration
- 測試工具：Vitest / Playwright
- 日期：
- 預期結果：poi、weather、road、travel 互動切換後，選取狀態、focus target 與 panel 狀態保持一致
- 實際結果：
- 是否通過：
- 備註：

## 先不執行 因為功能不添加
測試項目：road 模式切換後顯示道路圖層
- 任務代號：AT-19
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：切換到 road mode 後，道路圖層顯示正常且不造成畫面錯亂
- 實際結果：
- 是否通過：
- 備註：

測試項目：road 路段點擊後顯示對應資訊
- 任務代號：AT-19
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：點擊道路路段後，可正確選取對應 road segment 並顯示資訊
- 實際結果：
- 是否通過：
- 備註：
## 先不執行 因為功能不添加

## 先不執行 因為功能尚未定完成
測試項目：travel 行程點位顯示
- 任務代號：AT-20
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：已選取旅遊日存在資料時，travel stop 與 timeline item 點位能正常顯示
- 實際結果：
- 是否通過：
- 備註：

測試項目：travel 點位點擊後保持既有 mode 並更新焦點
- 任務代號：AT-20
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：點擊 travel marker 後，地圖焦點更新，但不會錯誤切換目前 info mode
- 實際結果：
- 是否通過：
- 備註：

測試項目：timeline 切換日期後更新對應地圖內容
- 任務代號：AT-20
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：切換 travel day 後，地圖上的行程點位與相關內容同步更新
- 實際結果：
- 是否通過：
- 備註：

測試項目：timeline 播放控制正常運作
- 任務代號：AT-20
- 優先級：P2
- 是否自動化：否
- 測試層級：Manual
- 測試工具：手動驗證
- 日期：
- 預期結果：時間軸播放、暫停、速度切換與時間選擇皆正常，且不影響主要地圖互動
- 實際結果：
- 是否通過：
- 備註：
## 先不執行 因為功能尚未定完成

### 9. 自動化任務分類與執行清單

以下清單依據「是否適合自動化」與「執行優先級」整理，供後續由 agent 直接開始執行測試。原則是：先保護核心使用路徑，再補強資料與運營防線，最後才處理低價值或高度視覺化的項目。

#### 9.1 P0：必須自動化（立即執行）

這些任務直接影響產品是否能正常使用，屬於最優先的自動化防線。

- [AT-01] 地圖載入 smoke test
  - 驗證：地圖容器能建立，地圖 UI 可顯示，不會白屏
  - 測試工具：Playwright
  - 預期：首次載入成功，無關鍵錯誤

- [AT-02] POI marker 顯示與點擊互動
  - 驗證：POI 點位可顯示，點擊後可打開詳細內容
  - 測試工具：Playwright + Testing Library
  - 預期：點擊後內容面板正確開啟，狀態更新正確

- [AT-03] weather 測站顯示與點擊互動
  - 驗證：weather mode 下測站可顯示並顯示對應資訊
  - 測試工具：Playwright
  - 預期：資料與 marker 對應正確，不影響地圖基本操作

- [AT-04] 模式切換：poi / weather / overview
  - 驗證：不同 mode 之間切換正常，UI 狀態一致
  - 測試工具：Playwright
  - 預期：不產生殘留 focus、panel 狀態錯亂

- [AT-05] 空白地圖點擊後清除選取狀態
  - 驗證：點擊空白區後清除既有 marker 選取與 focus
  - 測試工具：Playwright
  - 預期：不殘留錯誤狀態

- [AT-06] API 失敗時 fallback 行為
  - 驗證：POI / weather / Iceland 狀態 API 失敗時不直接崩潰
  - 測試工具：MSW + Playwright
  - 預期：地圖仍維持基本可用，顯示 fallback / local data

- [AT-07] 離線資料與 fallback 資料渲染
  - 驗證：離線資料或 fallback 資料時，地圖容器仍可建立
  - 測試工具：Playwright + MSW
  - 預期：不出現空白頁，基本地圖與點位仍可顯示

- [AT-08] 資料 schema 與轉換驗證
  - 驗證：POI / weather / status 資料符合 schema，異常資料能被處理
  - 測試工具：Vitest
  - 預期：轉換邏輯正確，錯誤資料不破壞 UI

- [AT-09] fallback chain 邏輯測試
  - 驗證：Redis stale cache → snapshot → mock 的順序與判斷正常
  - 測試工具：Vitest / integration test
  - 預期：降級路徑依規格執行，資料契約一致

- [AT-10] selectedTime / playbackState / timeline 狀態邏輯
  - 驗證：播放、暫停、拖曳、回到現在等狀態切換正確
  - 測試工具：Vitest
  - 預期：UI 與資料同步，不出現狀態錯亂

#### 9.2 P1：可自動化，但可後續補強

這些是重要功能，但相對不屬於「每次修改都必須跑」的核心路徑。

- [AT-11] POI 詳細卡圖片切換
  - 驗證：上一張 / 下一張 / 指定圖片切換正常
  - 測試工具：Testing Library / Playwright
  - 預期：圖片切換邏輯穩定，無錯誤重置

- [AT-12] settings panel 開關與分頁切換
  - 驗證：panel 打開/關閉與各頁籤切換正常
  - 測試工具：Testing Library
  - 預期：狀態保留合理，不造成 UI 崩潰

- [AT-13] scene control 調整後仍可用
  - 驗證：display / lighting / terrain detail 設定變更後不破壞畫面
  - 測試工具：Playwright
  - 預期：畫面穩定，沒有明顯錯誤渲染

- [AT-14] marker interaction 狀態一致性
  - 驗證：不同 mode 之間的 active marker 與 focus target 一致
  - 測試工具：Vitest / Playwright
  - 預期：切換 mode 後不殘留舊狀態

- [AT-15] travel plan marker 去重邏輯
  - 驗證：同一 day 內重複 stop / timeline item 不會重複產生 marker
  - 測試工具：Vitest
  - 預期：去重邏輯正確

- [AT-16] 效能 smoke test（初始載入與互動時間）
  - 驗證：首頁與地圖初始化是否維持合理速度
  - 測試工具：Playwright + Web Vitals
  - 預期：LCP / 初始互動沒有明顯回歸

- [AT-17] CI gate：lint / build / test
  - 驗證：PR / main branch 有自動檢查防線
  - 測試工具：CI workflow
  - 預期：壞版不直接進入部署流程

- [AT-18] Demo Sprint 關鍵流程
  - 驗證：POI / travel list / AI recommendation 可連續展示
  - 測試工具：Playwright smoke
  - 預期：Demo 能順暢進行，而不是機率性失敗

#### 9.3 P2：手動驗證優先 / 不建議立即自動化

這些項目目前不適合直接寫成穩定的自動測試，因為它們多半是視覺細節、尚未定義完成的功能，或屬於低頻需求。

- [AT-19] road mode 圖層顯示與點擊資訊
  - 目前：功能不添加，先不執行
  - 優先判斷：手動驗證

- [AT-20] travel timeline 完整播放與日期切換
  - 目前：功能尚未定完成
  - 優先判斷：手動驗證，待功能穩定後再自動化

- [AT-21] 純視覺細節與 camera motion 微調
  - 例如：鏡頭訪大動作、UI 版面細節、貼圖觀感
  - 優先判斷：手動觀察

- [AT-22] 高負載壓力與長時間連續操作
  - 例如：高頻資料更新、長時間使用、記憶體壓力測試
  - 優先判斷：少量 smoke + 手動觀察

- [AT-23] 高精度渲染差異比較
  - 例如：地形、光照、圖磚細節比較
  - 優先判斷：視覺驗證，不做強制自動化

#### 9.4 建議執行順序（給 agent）

依照最小成本保護核心功能的原則，建議依序執行：

1. P0：AT-01 至 AT-10
2. P1：AT-11 至 AT-18
3. P2：AT-19 至 AT-23（待功能成熟後再處理）

執行規則：

- 每個任務先定義預期結果
- 再進行測試編寫與驗證
- 測試失敗時先修正根因，再重跑
- 不為了「自動化」而自動化，只有核心與高價值路徑才納入

#### 9.5 Agent 執行入口

後續 agent 可優先從以下任務啟動：

- 地圖載入 smoke test
- POI / weather 點擊互動
- fallback 與 offline 資料保護
- 資料 schema / state logic
- timeline 狀態邏輯

這些項目能最大化測試收益，且最符合本專案的 side project 需求：少量但有價值的自動化防線。

 