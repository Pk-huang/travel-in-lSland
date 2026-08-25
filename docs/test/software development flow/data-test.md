# 數據規劃測試內容

## 測試結果記錄格式

- **測試結果**：成功 / 失敗
- **失敗項目**：無 / 連線測試 / 回應狀態測試 / fallback 測試 / 資料契約驗證
- **備註**：

---

## 1. Source / API / JSON

### 功能與測試內容

#### A. 主資料源

| 名稱 | 用途 | 格式 | 目前狀態 | 優先級 |
| ------ | ------ | ------ | --------- | -------- |
| NOAA SWPC Aurora JSON | 極光預報 | JSON API | 來源存在，尚未接入程式 | 高 |
| Vedur Weather API | 冰島天氣、測站、觀測資料 | JSON API | 已接入程式並使用 | 高 |

#### B. 備用資料源

| 名稱 | 用途 | 格式 | 目前狀態 | 優先級 |
| ------ | ------ | ------ | --------- | -------- |
| APIs.is | 公開資料彙整入口 | JSON API | 來源存在，尚未接入程式 | 中 |
| 本地 snapshot fixture | API 失敗時提供保底資料 | 本地 JSON | 已接入程式並使用 | 高（保底） |
| Umferdin 網頁資料 | 冰島道路資訊參考 | 網站資料，尚未確認為穩定 JSON API | 來源存在，尚未接入程式 | 低 |

#### C. 參考資料源

| 名稱 | 用途 | 格式 | 目前狀態 | 優先級 |
| ------ | ------ | ------ | --------- | -------- |
| Vedur 北極光頁面 | 人工比對與情境驗證 | HTML 網頁 | 僅供人工參考，未接入程式 | 低 |

#### D. 目前程式已使用但原清單未完整列出的資料源

| 名稱 | 用途 | 格式 | 目前狀態 | 優先級 |
| ------ | ------ | ------ | --------- | -------- |
| Sunrise-Sunset API | 日出、日落與日照資料 | JSON API | 已接入程式並使用 | 中 |

---

### 測試內容

#### 1. 連線測試

##### 驗證：確認 API 是否可正常連線，並成功取得 JSON

- **執行方式**：自動化腳本請求主資料源與備用資料源，檢查 HTTP 狀態與 JSON 是否可解析
- **測試檔案**：`src/lib/api/api-connect.test.tsx`
- **成功條件**：HTTP 200 / JSON parse 成功
- **參與檔案**：
  - `src/lib/api/api-connect.test.tsx`
  - `src/lib/api/vedur.ts`
  - `src/lib/api/sun-times.ts`
  - `src/lib/http/client.ts`
- **結果**：失敗
- **失敗項目**：連線測試
- **備註**：
  - NOAA SWPC Aurora JSON — 失敗：測試環境連線 timeout
  - Vedur observations — 成功
  - Vedur stations — 成功
  - APIs.is — 失敗：測試環境連線失敗
  - Sunrise-Sunset API — 成功
  - 本地 snapshot fixture — 成功

##### 驗證：確認主資料源是否成功回應資料

- **執行方式**：自動化腳本呼叫主資料源，檢查是否回傳成功狀態與有效資料
- **測試檔案**：`src/lib/api/api-connect.test.tsx`
- **成功條件**：主資料源回應 HTTP 200，JSON parse 成功，且 Vedur function 回傳資料
- **參與檔案**：
  - `src/lib/api/vedur.ts`
  - `src/app/data/iceland-status/route.ts`
- **結果**：失敗
- **備註**：Vedur observations 與 Vedur stations 成功；NOAA SWPC Aurora JSON 因測試環境連線 timeout 失敗

##### 驗證：確認備用資料源與 fallback 資料是否可用

- **執行方式**：自動化腳本驗證備用資料源與 local fixture 是否能正常回應並被選用
- **測試檔案**：`src/lib/api/api-connect.test.tsx`
- **成功條件**：備用資料源回應 HTTP 200 且 JSON parse 成功；本地 snapshot fixture 可正常讀取
- **參與檔案**：
  - `src/app/data/iceland-status/route.ts`
  - `src/lib/http/circuit-breaker.ts`
- **結果**：失敗
- **備註**：本地 snapshot fixture 成功；APIs.is 因測試環境連線失敗，且本次尚未驗證 fallback 是否被選用

#### 2. 回應狀態測試

##### 驗證：確認 API 回應是否為成功狀態（200 / 正確 JSON）

- **執行方式**：使用 unit test mock fetch 回傳 HTTP 200 與有效 JSON，直接呼叫 fetchJson，驗證函式成功解析並回傳資料
- **測試檔案**：`src/lib/http/client.test.ts`
- **成功條件**：HTTP 200 時，fetchJson 成功完成並回傳解析後的 JSON
- **參與檔案**：
  - `src/lib/http/client.ts`
  - `src/lib/http/client.test.ts`
- **結果**：成功
- **失敗項目**：無
- **備註**：測試不依賴外部網路，未額外驗證 Content-Type、schema 或 fallback

##### 驗證：確認 timeout、403、500、空回應時的處理方式

- **執行方式**：使用 unit test mock fetch 模擬 timeout、403、500 與空回應，直接呼叫 fetchJson，驗證錯誤是否統一轉換為 UpstreamError
- **測試檔案**：`src/lib/http/client.test.ts`
- **成功條件**：timeout 與空回應轉換為 UpstreamError；403 與 500 的 UpstreamError 保留對應 HTTP status；錯誤情境不回傳未處理例外
- **參與檔案**：
  - `src/lib/http/client.ts`
  - `src/lib/http/client.test.ts`
- **結果**：成功
- **失敗項目**：無
- **備註**：共 4 類錯誤情境測試通過；本項只驗證 HTTP client 的錯誤處理，不驗證 fallback 選用或 circuit breaker 狀態轉換

#### 3. Fallback 測試

##### 驗證：主 API 成功時使用主資料

- **執行方式**：自動化腳本模擬主資料源可用，確認系統選擇主資料來源
- **測試檔案**：`src/app/data/iceland-status/route.test.ts`
- **成功條件**：上游請求成功時，回應為 HTTP 200，`meta.fallback = false`，且資料內容來自即時上游（非 snapshot fixture）
- **參與檔案**：`src/app/data/iceland-status/route.ts`
- **結果**：成功
- **備註**：對應 `route.test.ts` case「主 API 成功時使用主資料」通過

##### 驗證：主 API 失敗時切換至備用資料

- **執行方式**：自動化腳本 mock 主資料源失敗，驗證是否轉向備用資料源
- **測試檔案**：`src/app/data/iceland-status/route.test.ts`、`src/lib/http/circuit-breaker.test.ts`
- **成功條件**：主資料源失敗時，系統不回傳未處理例外；可回應 fallback 資料（stale cache 或 snapshot），且 `meta.fallback = true`
- **參與檔案**：
  - `src/app/data/iceland-status/route.ts`
  - `src/lib/http/circuit-breaker.ts`
- **結果**：成功
- **備註**：對應 `route.test.ts` case「主 API 失敗時切換至 fallback 路徑」通過；本次未新增 circuit-breaker 單測

##### 驗證：備用資料也失敗時使用 local JSON / empty-safe fallback

- **執行方式**：自動化腳本 mock 備用資料失敗，確認 fallback chain 是否進入本地資料
- **測試檔案**：`src/app/data/iceland-status/route.test.ts`
- **成功條件**：當上游不可用且無可用遠端備援時，回應仍為 HTTP 200，並使用本地 snapshot fixture；`meta.fallback = true` 且資料可通過 schema parse
- **參與檔案**：`src/app/data/iceland-status/route.ts`
- **結果**：成功
- **備註**：對應 `route.test.ts` case「上游不可用時使用 local snapshot fallback」通過

##### 驗證：備用資料回傳空資料時，系統仍不崩潰並顯示明確警告

- **執行方式**：自動化腳本回傳空陣列或空物件，驗證錯誤處理邏輯與 UI 狀態
- **測試檔案**：`src/app/data/iceland-status/route.test.ts`、`src/lib/client/use-iceland-status.test.tsx`
- **成功條件**：空資料情境下 API 不崩潰（回傳受控錯誤或 fallback 資料），前端 hook 進入可預期狀態（error 或可渲染空集合），不出現未捕捉例外
- **參與檔案**：
  - `src/app/data/iceland-status/route.ts`
  - `src/schemas/domain.ts`
- **結果**：成功
- **備註**：對應 `route.test.ts` case「空資料或邊界資料時不崩潰，並回傳可處理結果」通過

#### 4. 資料契約驗證

##### 驗證：必要欄位是否存在

- **執行方式**：自動化腳本檢查資料 schema 的必填欄位是否全部存在
- **測試檔案**：`src/schemas/domain.test.ts`、`src/app/data/iceland-status/route.test.ts`
- **成功條件**：缺少必填欄位（meta、weather、roads、aurora、summary）時，schema 驗證失敗；欄位齊全時可成功 parse
- **參與檔案**：`src/schemas/domain.ts`
- **結果**：成功
- **備註**：`domain.test.ts` case「icelandStatusResponseSchema - required fields」全 5 個通過

##### 驗證：欄位型別是否正確

- **執行方式**：自動化腳本檢查欄位型別是否符合預期格式
- **測試檔案**：`src/schemas/domain.test.ts`、`src/lib/adapters/weather.test.ts`
- **成功條件**：型別正確資料可通過 zod schema；錯誤型別（例如字串溫度、無效 datetime）必定被拒絕並回傳可識別驗證錯誤
- **參與檔案**：
  - `src/schemas/domain.ts`
  - `src/lib/adapters/weather.ts`
- **結果**：成功
- **備註**：`domain.test.ts`「icelandStatusResponseSchema - field types」6 個 type validation case 全過；`weather.test.ts` `deriveAlertLevel` 邏輯驗證 9 個 case 全過

##### 驗證：資料是否可直接進入 render pipeline

- **執行方式**：自動化腳本驗證資料結構是否符合 map / canvas 所需解構
- **測試檔案**：`src/lib/adapters/weather.test.ts`、`src/lib/adapters/stations.test.ts`、`src/lib/adapters/road.test.ts`、`src/lib/client/use-iceland-status.test.tsx`
- **成功條件**：adapter 輸出結構可直接被前端狀態層消費（weather/roads 為可迭代陣列、必要座標與時間欄位可用），渲染流程不需額外轉型
- **參與檔案**：
  - `src/lib/adapters/weather.ts`
  - `src/lib/adapters/stations.ts`
  - `src/lib/adapters/road.ts`
- **結果**：成功
- **備註**：`weather.test.ts` 7 個 structure case、`road.test.ts` 7 個 structure case、`stations.test.ts` 7 個 lookup table case 全過

##### 驗證：缺失欄位時是否可進行 default / fallback

- **執行方式**：自動化腳本刪除欄位或設為空值，確認 fallback 邏輯是否生效
- **測試檔案**：`src/app/data/iceland-status/route.test.ts`、`src/schemas/domain.test.ts`、`src/lib/adapters/weather.test.ts`
- **成功條件**：缺值時可套用既定 default（例如數值欄位補 0 或 optional 欄位省略），若仍不合法則進入受控 fallback/錯誤回應，不產生未處理例外
- **參與檔案**：
  - `src/app/data/iceland-status/route.ts`
  - `src/schemas/domain.ts`
- **結果**：成功
- **備註**：`weather.test.ts`「parseWeather - default/fallback for missing fields」5 個 case、`road.test.ts` 3 個座標 fallback case、`route.test.ts` 1 個空資料 case 全過

### 驗收條件

- 主資料源正常時優先使用主資料源
- 主資料源失敗時可自動切換至備用資料來源
- 備用資料來源失敗時可使用 fallback 資料
- 系統在錯誤情境下不會崩潰，且仍能維持可用狀態

**測試結果**：成功 / 失敗  
**失敗項目**：

---

### 其他驗證項目

#### JSON 是否優先被應用，並在渲染流程前完成載入

- **功能目的**：確認系統依照優先順序選擇正確資料來源，並在初始化前完成載入
- **測試內容**：檢查資料優先順序是否正確，載入時機是否在 render pipeline 啟動前完成
- **驗證條件**：正確資料被優先選擇，且在地圖渲染前已準備完成

#### API 內容是否已轉換成 render 所需的 data

- **功能目的**：確認原始資料已轉換成後續流程可直接使用的資料結構
- **測試內容**：檢查原始 API / JSON 是否已成為 render-ready 資料，符合 map / canvas 流程契約
- **驗證條件**：資料可直接進入後續轉換與渲染流程，不需要手動修正格式

#### 設定優先順序與載入順序

- **功能目的**：確認多個資料來源時，系統按正確優先順序選用並依序載入
- **測試內容**：檢查資料載入順序與優先層級是否符合設定
- **驗證條件**：地形資料先載入，地貌資料依必要順序後載入，且順序穩定

---

## 2. Validation / schema / fallback

### 工作範疇

驗證資料是否完整、格式正確，並在失敗時提供回復機制。

### 內容

檢查資料契約、資料完整性、缺失欄位處理與 fallback 策略。

### Validation 功能與測試內容

#### 資料來源與資料完整性驗證

- **功能目的**：確認 API / JSON 提供的資料可被後續地圖流程正確解析與使用
- **測試內容**：檢查 API 是否可提供可用資料、資料格式是否完整、是否含有必要欄位、是否可進入後續流程
- **驗證條件**：回應成功、資料內容完整、格式正確、必要欄位存在、可被後續流程使用
- **缺口與補測規劃**：外部來源穩定性證據不足（受測試環境 timeout 影響）
- **結果**：部分已驗證
- **成功率**：NOAA 20/20（100%）；APIs.is 0/20（0%）
- **備註**：vitest 單次執行仍出現 NOAA 與 APIs.is timeout，顯示測試環境路徑與直連探測結果存在差異

#### JSON 資料格式是否完整

- **功能目的**：確認 JSON 可被解析並符合地圖渲染所需的資料契約
- **測試內容**：檢查欄位是否完整、資料型別是否正確、是否存在空值或破損資料
- **驗證條件**：JSON 可解析、必要欄位存在、資料型別正確、無缺失或損壞資料

#### 地理資料與數值範圍驗證

- **功能目的**：確認地形與地貌資料具備有效的地理資訊與數值範圍
- **測試內容**：檢查座標、範圍、高度、標記資料是否存在且合理
- **驗證條件**：地理範圍、座標、高度、標記資料完整且有效
- **缺口與補測規劃**：合理範圍規則尚未明確驗證
- **結果**：部分已驗證
- **成功率**：既有相關測試 36/36 通過（`src/lib/adapters/road.test.ts`、`src/lib/adapters/stations.test.ts`、`src/schemas/domain.test.ts`）
- **備註**：目前可證明結構與 fallback 流程正常；經緯度上下限、高度區間、極端值邊界規則仍需新增明確測試 case

#### 異常資料處理

- **功能目的**：確認系統在資料錯誤時能安全處理，不會直接崩潰
- **測試內容**：檢查缺失欄位、空值、錯誤格式、解析失敗時的處理方式
- **驗證條件**：系統能記錄錯誤、切換備用資料或回傳明確錯誤訊息
