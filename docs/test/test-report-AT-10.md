# 測試執行報告

## 1. 目的

本報告記錄本次測試環境建立與核心自動化驗證的執行狀態，作為專案進度與驗證證據的獨立文件，不寫回 [docs/test/testing-plan.md](docs/test/testing-plan.md)。

## 2. 執行階段狀態

### A1. 安裝與設定測試環境
- 狀態：已完成
- 內容：
  - 安裝 Vitest + jsdom + Testing Library
  - 安裝 Playwright + Chromium
  - 補齊 `@playwright/test` 依賴
  - 修正 Vitest 與 Playwright 共存設定
- 主要修正：
  - `vitest.config.ts` 排除 `src/e2e/**`，避免 E2E 測試被 Vitest 直接當作 unit test 執行

### A2. 補 P0 unit test（marker interaction / state logic）
- 狀態：已完成
- 已驗證內容：
  - marker interaction core logic
  - feature POI fallback logic
- 備註：這部分以 Vitest 進行，聚焦在狀態與資料 fallback 行為，而非真實瀏覽器

### A3. 補 Playwright smoke test
- 狀態：已完成
- 已驗證內容：
  - 首頁載入
  - 主要模式按鈕可見
  - mode 切換後 UI 保持正常
- 驗證命令：
  - `cd /Users/james.pk.huang/Desktop/island && corepack pnpm exec playwright test src/e2e/smoke.spec.ts --reporter=line`
- 驗證結果：
  - `2 passed (1.3s)`

### A4. 補 API fallback / offline 測試
- 狀態：已完成
- 已驗證內容：
  - POI API 成功時使用 API 資料
  - POI API 失敗時回退本地 seeds
  - POI API 回傳空資料時回退本地 seeds
  - Iceland status API 失敗時記錄錯誤並保持 hook 可用
- 驗證命令：
  - `cd /Users/james.pk.huang/Desktop/island && corepack pnpm exec vitest run src/lib/client/use-featured-pois.test.tsx src/lib/client/use-iceland-status.test.tsx`
- 驗證結果：
  - `Test Files  2 passed (2)`
  - `Tests  5 passed (5)`

### A5. 整理最終執行報告與 P0 狀態歸納
- 狀態：已完成
- 內容：
  - 整理本次自動化執行結果，區分「已通過」「部分通過」「未直接驗證」
  - 總結 AT-01 至 AT-10 的現況，與計畫文件的任務分類保持一致
  - 補充執行證據與實際風險說明，避免誤報為完整 P0 全量驗證
- 重要結論：
  - `AT-01`：已通過
  - `AT-04`：已通過
  - `AT-06`：已通過
  - `AT-07`：已通過
  - `AT-02` / `AT-03` / `AT-05` / `AT-08` / `AT-09` / `AT-10`：目前僅部分覆蓋或未直接驗證，尚未視為全量完成

## 3. 目前狀態總結

目前已完成：
- A1
- A2
- A3
- A4
- A5

## 4. AT-01 至 AT-10 實際執行狀態（依據目前驗證證據）

| 任務 | 優先級 | 狀態 | 說明 |
| --- | --- | --- | --- |
| AT-01 | P0 | 已通過 | Playwright smoke 測試確認首頁載入成功 |
| AT-02 | P0 | 部分覆蓋 | 目前未有獨立 POI click assertion，僅有 smoke 路徑確認 |
| AT-03 | P0 | 部分覆蓋 | mode switch 路徑已確認，未有站點點擊完整驗證 |
| AT-04 | P0 | 已通過 | mode 切換 smoke 測試已驗證 |
| AT-05 | P0 | 尚未直接驗證 | 空白區點擊清除狀態仍缺獨立測試 |
| AT-06 | P0 | 已通過 | fallback hook 測試成功，API 失敗與空資料都回退正常 |
| AT-07 | P0 | 已通過 | fallback / offline-safe 行為已被驗證 |
| AT-08 | P0 | 未直接驗證 | 尚未新增獨立 schema assertion |
| AT-09 | P0 | 未直接驗證 | 完整 fallback chain sequence 尚未補齊 |
| AT-10 | P0 | 未直接驗證 | timeline / playback state logic 尚未新增測試 |

## 5. 重要觀察

- Playwright 與 Vitest 雖然都使用同一專案，但它們的 test scope 必須分開管理。
- `src/e2e` 應該被排除出 Vitest，否則會造成 test discovery 衝突。
- 真實瀏覽器驗證與 hook-level fallback 証明都是必要的，但各自負責不同層級的風險：
  - smoke test 驗證正常使用路徑
  - fallback test 驗證錯誤與降級路徑
- 目前這份自動化測試符合 side-project 的最小有效防線原則，但不應被宣稱為 `AT-01 ~ AT-10` 的全部完成。

## 6. 相關檔案

- [src/e2e/smoke.spec.ts](src/e2e/smoke.spec.ts)
- [src/lib/client/use-featured-pois.test.tsx](src/lib/client/use-featured-pois.test.tsx)
- [src/lib/client/use-iceland-status.test.tsx](src/lib/client/use-iceland-status.test.tsx)
- [vitest.config.ts](vitest.config.ts)

## 7. 執行狀態結論

本次自動化測試已建立起最小有效的防線，覆蓋了：
- 正常地圖載入
- 主要互動模式切換
- API fallback / offline-safe 行為

這符合目前專案 side-project 的測試目標：少量但高價值的自動化保護。
同時，這份結論是基於實際驗證證據，未將未直接執行的 P0 案例誤判為已完成。
## 4. 重要觀察

- Playwright 與 Vitest 雖然都使用同一專案，但它們的 test scope 必須分開管理。
- `src/e2e` 應該被排除出 Vitest，否則會造成 test discovery 衝突。
- 真實瀏覽器驗證與 hook-level fallback 証明都是必要的，但各自負責不同層級的風險：
  - smoke test 驗證正常使用路徑
  - fallback test 驗證錯誤與降級路徑

## 5. 相關檔案

- [src/e2e/smoke.spec.ts](src/e2e/smoke.spec.ts)
- [src/lib/client/use-featured-pois.test.tsx](src/lib/client/use-featured-pois.test.tsx)
- [src/lib/client/use-iceland-status.test.tsx](src/lib/client/use-iceland-status.test.tsx)
- [vitest.config.ts](vitest.config.ts)

## 6. 執行狀態結論

本次自動化測試已建立起最小有效的防線，覆蓋了：
- 正常地圖載入
- 主要互動模式切換
- API fallback / offline-safe 行為

這符合目前專案 side-project 的測試目標：少量但高價值的自動化保護。
