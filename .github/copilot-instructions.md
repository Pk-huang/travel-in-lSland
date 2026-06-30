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
4. **給使用者看**：說明改了什麼、驗證結果，請他在瀏覽器確認視覺。
5. **commit 前必先問**：絕不自行 commit。使用者說 commit 才執行 `git add -A && git commit && git push`。

> 一句話：**先講 → 改 → 驗證 → 給看 → 問 → commit**。寧可切太細，不要一次做太多。

## Commit 規範

- 格式：`type(scope): summary (phase x)`，例：`feat(map): add SeaLevel plane (phase 2-1a)`。
- type：feat / fix / refactor / chore / docs。
- 一個 commit 一個概念，對應一個最小步。
- commit 後通常接 `git push`（會觸發 Vercel 自動部署）。

## 程式碼風格

- **變數命名要有意義**：`height` 不寫 `h`、`positions` 不寫 `pos`、`segments` 不寫 `seg`。
- **元件按角色切分**：地圖內每種角色獨立一檔（Terrain 地塊 / SeaLevel 海面 / CameraRig 相機 / StationLayer 測站 / Lighting 光）。切分目的是**故障定位**——某層壞掉能立刻知道是哪支。
- **開發期用強烈除錯色**確認幾何/分層正確，正式配色另開一個步驟處理。
- 除錯用的 `console.log` / wireframe / DebugAxes 等輔助，**不混進正式 commit**（除非使用者明確說保留，例如目前 DebugAxes 保留中）。

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

## 教學模式

- 使用者常問「為什麼」「這是什麼意思」。遇到時**詳細解釋觀念**（用表格、對照、類比），不要只給程式碼。
- 重要觀念問答記錄到 `docs/notes/`（例如 R3F 觀念在 docs/notes/r3f-concepts.md）。
- 解釋要分層次（例如 three / R3F / drei 三層），幫助建立心智模型。

## 文件

- 不主動為每次改動建立 markdown 總結檔（除非使用者要求）。
- 進度里程碑記錄在 IMPLEMENTATION_PROGRESS_LOG.md。
