# Copilot Instructions — Iceland Insight (travel-in-lSland)

這份檔案定義本專案的開發協作規範。每次協助都必須遵循。

## 語言

- 一律用**繁體中文**回覆。
- 程式碼註解用繁體中文。
- commit 訊息用英文（Conventional Commits）。

## 核心開發節奏（最重要）

採「**最小步開發**」，一次只動**一個概念**，流程固定如下：

1. **先講做法**：動手前先用文字說明這一步要改什麼、為什麼，等使用者確認。
2. **動手改檔**：實作這一個最小步。
3. **驗證三連**：每次改完依序跑
   - `get_errors`（型別/編譯）
   - `corepack pnpm lint`
   - `curl -s -o /dev/null -w "home:%{http_code}\n" http://localhost:3000/`（確認 200；dev server 多半已在背景跑）
   - **額外 build**：若這一步牽涉「設定檔 / 相依套件 / 型別契約（types、schemas、API 形狀）」，必須再跑 `corepack pnpm build`。理由：dev/lint 過 ≠ 能部署（已踩過 Vercel build 才爆的雷）。
4. **給使用者看**：說明改了什麼、驗證結果，請他在瀏覽器確認視覺。
5. **commit 前必先問**：絕不自行 commit。使用者說 commit 才執行 `git add -A && git commit && git push`。

> 一句話：**先講 → 改 → 驗證 → 給看 → 問 → commit**。寧可切太細，不要一次做太多。

## 命令授權協議（嚴格執行）

- 每次要動手前，Agent 必須先提出一個「單一步驟」提案，並定義：`[代號] 動作名稱`（例如：`[A1] 修改api`）。
- Agent 提案結尾必須明確詢問：`請問是否要進行「動作名稱」？`
- 使用者可用以下任一格式授權執行：
   - `動作名稱`
   - `肯定詞 + 空格 + 動作名稱`（例如：`可以 修改api`）
- 動作名稱採**嚴格比對**；不一致、近似字詞、縮寫都視為未授權。
- 若格式不完整（例如只回肯定詞），Agent 必須要求補齊，不得執行任何改檔或命令。
- 同一時間只允許一個有效命令；未完成前不得擴做其他動作。
- 命令執行完成後，該命令立即失效：
   - 後續再次輸入同一動作名稱，只能視為查詢，不視為下命令。
   - 不提供重新授權；同一命令不得重複下達。
- 若需要再次執行同類工作，Agent 必須提出全新代號與全新動作名稱，再走一次完整確認流程。

## 工程防護網（資深工程師準則）

### 誠實準則（硬性）

- **不假裝完成**：不確定就說不確定，禁止用「應該可以 / 大概 / 理論上」帶過。
- **未驗證要明講**：沒實際跑過的驗證，明白標註「未驗證」，不得暗示已驗證或捏造結果。
- **失敗先講根因**：遇錯先說明根本原因，再提解法；不默默繞過、不吞錯。

### 變更範圍紀律（blast radius）

- 一次只碰**一個關注點**；不順手重構、改格式或動無關程式。
- 改動**公用模組**（`src/types/`、`src/schemas/`、`src/lib/http/`、`src/lib/store/` 等被多處引用者）前，**必先 `list_code_usages`** 列出所有使用點、評估影響面，再動手。
- 不刪看似無用的程式，除非已確認無任何引用。

### 相依與安全

- 加套件前先評估：**體積、維護狀態、是否真的必要**（能用內建或既有就不加）。
- 版本走 lockfile，不隨手 `latest`。
- 祕密金鑰不寫進前端程式或 commit。


## Commit 規範

- 格式：`type(scope): summary (phase x)`，例：`feat(map): add SeaLevel plane (phase 2-1a)`。
- type：feat / fix / refactor / chore / docs。
- 一個 commit 一個概念，對應一個最小步。
- commit 後通常接 `git push`（會觸發 Vercel 自動部署）。

## 程式碼風格

- **變數命名要有意義**：`height` 不寫 `h`、`positions` 不寫 `pos`、`segments` 不寫 `seg`。
- **元件按角色切分**：地圖內每種角色獨立一檔（Terrain 地塊 / SeaLevel 海面 / CameraRig 相機 / StationLayer 測站 / Lighting 光）。切分目的是**故障定位**——某層壞掉能立刻知道是哪支。
- **開發期用強烈除錯色**確認幾何/分層正確，正式配色另開一個步驟處理。
- 除錯用的 `console.log` / wireframe / DebugAxes 等輔助，**不混進正式 commit**（除非使用者明確說保留）。DebugAxes 已於 Phase 2-1b 收尾（A-1）移出場景，元件檔保留備用。

## 技術約束

- 套件管理一律 **`corepack pnpm`**，**禁止**全域 pnpm 或 npm。
- Next.js App Router；3D 元件必須 `"use client"`（WebGL 僅 client）。
- 匯入路徑用 `@/src/...`（alias `@/*` → `./*`）。
- three.js 物件在 JSX 用小寫標籤免 import；只有在邏輯裡 `new`、或用 drei 大寫元件時才 import。

## 3D / 地圖座標約定

- three.js 右手座標：**X=東西、Y=高度、Z=南北**。
- 地形平面繞 X 軸 `-90°` 躺平至 XZ 平面；高度寫進 local Z（旋轉後成世界 Y）。
- 比例約定：**1 unit = 1 km**，平面中心 = 冰島大致中心。
- DebugAxes 顏色：**紅=X、綠=Y、藍=Z**。
- 測站（Phase 2-2）用 **InstancedMesh** 畫，效能優先。

## 3D 效能即設計

- 量大、重複的物件預設用 **InstancedMesh**（一次 draw call），不要 N 個 component。
- geometry / 計算結果用 **`useMemo` 快取**，**絕不**在 render loop（`useFrame`）每幀重建。
- 重資源（three.js 等）一律 **`next/dynamic` + `ssr:false`** 動態載入，附 loading fallback，避免打進首包。
- 留意 draw call 與頂點數；高密度 geometry 先評估再加。

## 教學模式

- 使用者常問「為什麼」「這是什麼意思」。遇到時**詳細解釋觀念**（用表格、對照、類比），不要只給程式碼。
- 重要觀念問答記錄到 `docs/notes/`（例如 R3F 觀念在 docs/notes/r3f-concepts.md）。
- 解釋要分層次（例如 three / R3F / drei 三層），幫助建立心智模型。

## 文件

- 不主動為每次改動建立 markdown 總結檔（除非使用者要求）。
- 進度里程碑記錄在 IMPLEMENTATION_PROGRESS_LOG.md。
