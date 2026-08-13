# 測試執行報告

## 1. 目的

本報告記錄 P1（AT-11 至 AT-18）自動化測試的執行狀態，聚焦在「高價值 UI / state / interaction 路徑」的實際驗證與證據整理，不寫回 [docs/test/testing-plan.md](docs/test/testing-plan.md)。

## 2. 執行階段狀態

### B1. 補齊 P1 unit / component 測試
- 狀態：已完成
- 已驗證內容：
  - POI 詳細卡圖片切換邏輯
  - settings panel 開啟 / 切換分頁 / 關閉行為
  - marker state 清理與 mode-state 一致性
  - travel map marker 去重邏輯
- 相關檔案：
  - [src/components/ui/map-marker-tag.test.tsx](src/components/ui/map-marker-tag.test.tsx)
  - [src/panel/control-panel/SceneControlPanel.test.tsx](src/panel/control-panel/SceneControlPanel.test.tsx)
  - [src/lib/store/workspace-marker-state.test.ts](src/lib/store/workspace-marker-state.test.ts)
  - [src/lib/travel-plans/build-travel-map-markers.test.ts](src/lib/travel-plans/build-travel-map-markers.test.ts)

### B2. 補齊 P1 Playwright smoke test
- 狀態：已完成
- 已驗證內容：
  - settings panel 可開啟與切換 tab
  - mode buttons 維持正常互動
  - 主要 UI 狀態不會失控
- 相關檔案：
  - [src/e2e/p1-overview.spec.ts](src/e2e/p1-overview.spec.ts)

### B3. 執行 P1 validation
- 狀態：已完成
- 驗證命令：
  - `cd /Users/james.pk.huang/Desktop/island && corepack pnpm exec vitest run src/components/ui/map-marker-tag.test.tsx src/panel/control-panel/SceneControlPanel.test.tsx src/lib/store/workspace-marker-state.test.ts src/lib/travel-plans/build-travel-map-markers.test.ts`
  - `cd /Users/james.pk.huang/Desktop/island && corepack pnpm exec playwright test src/e2e/p1-overview.spec.ts --reporter=line`
- 驗證結果：
  - Vitest：`Test Files  4 passed (4)`，`Tests  6 passed (6)`
  - Playwright：`2 passed (10.7s)`

## 3. AT-11 至 AT-18 實際執行狀態

| 任務 | 優先級 | 狀態 | 說明 |
| --- | --- | --- | --- |
| AT-11 | P1 | 已通過 | POI 詳細卡圖片切換邏輯已被 component test 驗證 |
| AT-12 | P1 | 已通過 | settings panel 打開、分頁切換、關閉行為已被驗證 |
| AT-13 | P1 | 已通過 | scene control 可用性已透過 smoke test 確認 |
| AT-14 | P1 | 已通過 | marker interaction 狀態一致性已被 store-level test 驗證 |
| AT-15 | P1 | 已通過 | travel plan marker 去重 logic 已被 unit test 驗證 |
| AT-16 | P1 | 部分覆蓋 | 效能 smoke 目前以 UI / interaction 可用性作基礎保護，尚未擴張到完整 Web Vitals 指標 |
| AT-17 | P1 | 未直接驗證 | CI gate 尚未有 actual workflow 檔案可驗證 |
| AT-18 | P1 | 已通過 | demo key flow 已以 smoke test 確認基礎互動穩定 |

## 4. 逐項自動化測試紀錄（AT-11 至 AT-18）

### AT-11：POI 詳細卡圖片切換
- 狀態：已通過
- 測試重點：驗證 POI 詳細卡中上一張、下一張與指定圖片切換邏輯是否正確
- 測試方式：Vitest + Testing Library，模擬圖片列表與按鈕互動
- 具體驗證：
  - 點擊上一張圖片會更新目前顯示索引
  - 點擊下一張圖片會更新目前顯示索引
  - 點擊指定圖片按鈕會直接跳到對應索引
- 驗證檔案： [src/components/ui/map-marker-tag.test.tsx](src/components/ui/map-marker-tag.test.tsx)
- 結論：圖片切換邏輯已被自動化驗證，且符合預期行為

### AT-12：settings panel 開關與分頁切換
- 狀態：已通過
- 測試重點：驗證 settings panel 的開啟、關閉、各分頁切換與狀態保留
- 測試方式：Vitest + Testing Library
- 具體驗證：
  - 開啟 panel 後，內容與 aria 狀態正確
  - 切換 timeline / display / lighting / detail 分頁時，內容更新正常
  - 關閉 panel 後，狀態不殘留錯誤
- 驗證檔案： [src/panel/control-panel/SceneControlPanel.test.tsx](src/panel/control-panel/SceneControlPanel.test.tsx)
- 結論：控制面板的互動狀態穩定，通過驗證

### AT-13：scene control 變更後畫面仍可用
- 狀態：已通過
- 測試重點：驗證修改 display / lighting / terrain detail 之後，UI 不會失控
- 測試方式：Playwright smoke test
- 具體驗證：
  - panel 操作後頁面仍可互動
  - 主要 UI 沒有崩潰或失去回應
  - 變更後仍維持基本場景可用性
- 驗證檔案： [src/e2e/p1-overview.spec.ts](src/e2e/p1-overview.spec.ts)
- 結論：設定調整後的場景可用性已確認正常

### AT-14：marker interaction 在 mode 切換後狀態一致
- 狀態：已通過
- 測試重點：驗證 mode 切換後仍維持一致的 selected state / focus target / panel state
- 測試方式：Vitest + state-level test
- 具體驗證：
  - 交叉切換模式後，選取狀態不殘留錯誤
  - focus target 仍與當前互動一致
  - panel 狀態沒有異常衍生
- 驗證檔案： [src/lib/store/workspace-marker-state.test.ts](src/lib/store/workspace-marker-state.test.ts)
- 結論：mode 切換時的狀態一致性已被自動化驗證

### AT-15：travel plan marker 去重邏輯
- 狀態：已通過
- 測試重點：驗證重複 stop / timeline item 不會重複產生 marker
- 測試方式：Vitest unit test
- 具體驗證：
  - 同一 day 內重複項目會被去重
  - marker 筆數保持合理
  - duplicate data 不會造成錯誤渲染
- 驗證檔案： [src/lib/travel-plans/build-travel-map-markers.test.ts](src/lib/travel-plans/build-travel-map-markers.test.ts)
- 結論：travel marker 去重邏輯已通過

### AT-16：效能 smoke test
- 狀態：部分覆蓋
- 測試重點：檢查初始載入和互動是否維持合理速度與可用性
- 測試方式：Playwright smoke / UI 無回歸檢查
- 具體驗證：
  - core flow 能正常操作
  - 尚未擴張到完整 Web Vitals / timing threshold
- 驗證檔案： [src/e2e/p1-overview.spec.ts](src/e2e/p1-overview.spec.ts)
- 結論：目前已建立互動性基本保護，但尚未達到完整 Web Vitals 層級驗證

### AT-17：CI gate：lint / build / test
- 狀態：未直接驗證
- 測試重點：確認 PR / main branch 是否有自動檢查防線
- 測試方式：CI workflow 檢查
- 具體驗證：
  - 目前尚未找到 actual workflow 檔案可供驗證
  - 這部分仍屬工程自動化落地缺口
- 結論：此項尚未直接驗證，需後續補齊 workflow 或 CI 文件證據

### AT-18：Demo Sprint 關鍵流程
- 狀態：已通過
- 測試重點：確認主要 demo flow 可連續執行，不會因為 UI 狀態干擾而失敗
- 測試方式：Playwright smoke
- 具體驗證：
  - panel / mode / state 切換可維持穩定
  - 主要互動 flow 可持續使用
- 驗證檔案： [src/e2e/p1-overview.spec.ts](src/e2e/p1-overview.spec.ts)
- 結論：Demo key flow 的基礎穩定性已確認正常

## 5. 重要觀察

- 此一批 P1 測試重點是「高價值互動與狀態一致性」，而非大規模覆蓋率測試。
- 我們已實際匯入相同 app 行為進行驗證，不只是 mock-only 斷言；browser smoke 與 unit test 彼此補強。
- 目前這批測試已足夠支撐 side project 的 P1 階段最低可用防線：互動可用、panel 可控、state 不殘留。

## 6. 相關檔案

- [src/components/ui/map-marker-tag.test.tsx](src/components/ui/map-marker-tag.test.tsx)
- [src/panel/control-panel/SceneControlPanel.test.tsx](src/panel/control-panel/SceneControlPanel.test.tsx)
- [src/lib/store/workspace-marker-state.test.ts](src/lib/store/workspace-marker-state.test.ts)
- [src/lib/travel-plans/build-travel-map-markers.test.ts](src/lib/travel-plans/build-travel-map-markers.test.ts)
- [src/e2e/p1-overview.spec.ts](src/e2e/p1-overview.spec.ts)

## 6. 執行狀態結論

P1（AT-11 至 AT-18）已依照實際執行證據補齊關鍵自動化測試；截至目前，已確認以下項目具備實際驗證：
- POI 詳細卡圖片切換
- settings panel 分頁切換與關閉
- mode / state 一致性
- travel plan marker 去重
- 主要互動 smoke flow

這批測試符合目前專案的核心目標：少量而高價值，足以在日常修改中保護最重要的互動路徑。
