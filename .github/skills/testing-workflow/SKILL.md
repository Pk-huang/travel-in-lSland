---
name: testing-workflow
description: "Use when adding, updating, or reviewing tests in this project. Apply the project's minimal, value-focused testing rules to choose unit, integration, live API, component, or Playwright E2E tests; test real implementations; validate fallback and state flows; and record results that match the tested scope."
---

# Testing Workflow

用最少成本保護高價值、使用者實際會走的流程。不要以覆蓋率作為主要目標，也不要為了「測得完整」加入與測試目的無關的斷言。


### 測試準則
1. 直接引用既有 function

-測試檔直接 import 被測試的 function。
-不在測試檔重新複製相同邏輯。
-測試的是實際程式，而不是另一份測試版本。

2. 測試方式依測試目的決定
要測 function 邏輯：使用 unit test。
要測多個模組串接：使用 integration test。
要測真實 API 是否可連線：使用 live / integration test。
要測使用者操作：使用 E2E test。

3. 只執行該測試項目要求的內容

測試項目寫「API 連線與 JSON」時，只驗證：
執行方式：
測試檔案：
成功條件：
其他行為留給對應的測試項目。

5. 不重複建立測試資料來源

優先使用既有 lib function 與設定。
不另外建立相同用途的 JSON。
測試只需要少量資料時，直接在測試檔中建立必要內容。

6. 測試結果必須對應測試內容
測試文件中的「成功」，只能代表該測試項目通過。
不能因為 API 連線成功，就表示 fallback 或 schema 也成功。
每個測試項目各自記錄結果。

7. 測試保持最小化

一個測試項目只處理一個明確目的。
不為了「測得更完整」而加入無關斷言。
測試 code 能清楚說明測試文件中的驗證內容即可。

7. 測試檔放在被測程式附近

8. 「import 原本的 function」是通則；但「使用 mock 或真實網路」則要根據測試目的決定。



許取得 明確同意 再 執行腳本
