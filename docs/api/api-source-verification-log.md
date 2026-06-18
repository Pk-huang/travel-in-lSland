# API 來源確認紀錄（AI 協作）

**更新日期：** 2026-06-18

本文件用來記錄我們如何使用 AI 協助確認 API 來源，並保留可追溯的決策證據。

## 本次協作紀錄（你做了什麼 / AI 建議了什麼）

| 階段 | 你做了什麼 | AI 給了什麼建議 | 產出 / 決策 |
|---|---|---|---|
| 1. 來源探索 | 你詢問「極光指數有沒有其他來源」與「冰島有哪些公開 API 可用」 | 先以機器可讀資料為優先，並比對 NOAA、Vedur、APIs.is | 確認 NOAA aurora JSON 作為主要候選，Vedur weather API 作為天氣情境補充 |
| 2. 可測試性需求 | 你要求整理並提供可在 Postman 測試的 URL | 提供可直接呼叫的端點清單與建議 headers | 產出可立即驗證的測試 URL 清單 |
| 3. 極光文件獨立化 | 你要求建立獨立的 aurora markdown 文件 | 建議把極光來源決策與其他 API 筆記分開 | 建立獨立極光研究文件 |
| 4. 文件集中化 | 你要求 API 文件集中於同一資料夾，內容需易讀、含 JSON 參照/測試網址/限制 | 建議採用 `docs/api` 集中管理與主題拆分 | 建立 `docs/api` 索引、主題文件與 Postman 快速上手文件 |
| 5. 舊檔清理 | 你要求保留新結構並刪除舊檔 | 建議移除重複舊文件，避免資訊漂移 | 完成 `docs` 根目錄舊檔清理，`docs/api` 成為單一事實來源 |
| 6. Git 發布 | 你要求初始化並推送到 GitHub | 依序執行 git init、commit、remote 設定與 push | `main` 已成功推送到 `origin` |

## AI 建議重點摘要

- 極光資料以 NOAA SWPC 作為主要機器可讀來源
- Vedur 極光頁先視為參考頁，除非有官方公開 JSON API 文件
- Vedur weather OpenAPI 與 observations 端點可補強天氣背景資料
- API 文件集中化可降低重複維護與資訊不一致風險
- 每個採用來源都要先做 live response 驗證再進入實作

## 目標

- 確保專案使用的每個 API 來源都可追溯、可測試
- 區分官方機器可讀 API 與網頁型參考來源
- 保留可重複執行的來源驗證流程，便於後續更新

## 標準驗證流程

1. **蒐集候選來源**
   - 由官方文件、政府入口或可信提供者開始
   - 記錄原始候選 URL 清單

2. **分類來源型態**
   - 官方 API 文件 / OpenAPI
   - 可直接取得的 JSON endpoint
   - 僅網頁參考（非 API）

3. **快速可用性測試**
   - 在 Postman 或瀏覽器確認端點可回應
   - 確認回應格式（API 預期為 `application/json`）

4. **欄位與結構檢查**
   - 確認 MVP 需要的欄位存在
   - 保留小型 JSON 範例，只放實際會用到的欄位

5. **限制與風險檢查**
   - 驗證認證方式、版本 header、rate limit、ToS
   - 記錄穩定性與更新頻率風險

6. **決策與文件化**
   - 將來源標記為 `adopted`、`reference-only` 或 `pending`
   - 在對應 API 文件中附上測試 URL 與備註

## AI 使用邊界

- AI 用於來源探索、整理與比較輔助
- 最終採用判斷以官方文件與實際 endpoint 回應為準
- 若 AI 結論與 live API 行為不一致，以 live 行為為準並記錄差異

## 證據表（目前）

| 來源 | URL | 型態 | 驗證結果 | 狀態 | 備註 |
|---|---|---|---|---|---|
| NOAA SWPC Aurora | https://services.swpc.noaa.gov/json/ovation_aurora_latest.json | 直接 JSON endpoint | 可回傳 JSON | adopted | 目前主要極光機器可讀來源 |
| Vedur Weather OpenAPI | https://api.vedur.is/weather/openapi.json | 官方 OpenAPI | 可回傳 OpenAPI JSON | adopted | stations/observations 的主要依據 |
| Vedur Aurora Page | https://vedur.is/vedur/spar/nordurljos/ | 網頁參考 | 網頁可開啟 | reference-only | 可作情境參考，尚未確認公開 JSON API |

## Postman 最小檢查清單

- `GET https://services.swpc.noaa.gov/json/ovation_aurora_latest.json`
- `GET https://api.vedur.is/weather/openapi.json`
- `GET https://api.vedur.is/weather/stations`
- `GET https://api.vedur.is/weather/observations/aws/hour/latest`

Headers：

- `Accept: application/json`
- Vedur 可選：`X-Vi-Api-Version: 2026-02-17`

## 變更紀錄

### 2026-06-18

- 建立初版 AI 協作 API 來源驗證紀錄
- 彙整目前來源決策與狀態
- 補上本次實際協作時間線（你做了什麼 / AI 建議什麼 / 最終決策）