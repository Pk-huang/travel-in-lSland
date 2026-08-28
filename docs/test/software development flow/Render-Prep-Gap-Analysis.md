# Render preparation / compatibility 缺口與不合理評估

**文件目的**：對標「Data-transformation-layer.txt」中的第 2 項「Render preparation / compatibility」，與「3Dmap-test-define.md」中的「map : canvas」，找出缺口、重複與不合理之處。

**評估日期**：2026-08-28

---

## 📊 對標分析

### 流程位置
```
Data layer → Transform layer → Render preparation → map : canvas
```

### Render preparation vs map : canvas 對應關係

| Render preparation 項目 | map : canvas 對應項 | 關係 | 備註 |
|------------------------|------------------|------|------|
| 渲染座標與地形顏色設定 | 3D 地形 mesh 與 geometry | 🔴 重複 | 已標記，但未移除 |
| Resolution / quality modes | 解析度切換壓力測試 | 🔴 重複 | 已標記，但未移除 |
| Camera / interaction spec | Camera / interaction / controls | ✅ 對應 | 無重複，但邊界混淆 |
| 畫布大小、viewport、DPR | Canvas / WebGL / GPU 渲染 | 🟡 部分對應 | 職責分工不清 |
| 解析度切換 | 解析度切換壓力測試 | 🟡 邊界不清 | 預設 vs 運行時混淆 |
| 光影、時間與場景參數 | Light / shadow / time of day | ✅ 對應 | 無重複，但預設/動態混淆 |
| 渲染器相容性與效能準備 | Canvas / WebGL / GPU + Performance | 🟡 過於寬泛 | 應分為 3 層：環境檢測、設定、效能 |

---

## 🔴 缺口 1：Scene 層級初始化完全缺失

### 問題描述
Render preparation 中沒有任何項目驗證「Scene 本身的視覺設定」。

### 應該包括但缺失的內容
```
- Scene background / clear color 設定
- Fog（若有）的參數（color、near、far）
- 場景邊界 / clipping plane 設定
- 環境光（ambient light）預設值
- Scene default render target 設定
```

### 為什麼重要
- **第 1 項**（Transform）只驗證座標/顏色轉換函式的邏輯
- **Scene setup** 首次在「map : canvas」中提到，但交付前應在 Render preparation 層級驗證
- 場景背景色/霧等設定若錯誤，會直接影響地形視覺呈現

### 建議補充

```markdown
- Scene 層級初始化

  功能目的：確認場景容器的基礎視覺設定與初始狀態正確。

  測試內容：
  - Scene background / clear color 正確
  - Fog 參數（若使用）符合設計
  - 場景邊界 / clipping plane 設定
  - 環境光預設值合理

  驗證條件：
  - Scene 建立後視覺參數完整
  - 背景、霧等特效符合預期
  - 場景邊界防止物件超出視範
```

---

## 🔴 缺口 2：Material 綁定驗證缺失

### 問題描述
第 1 項的「terrain-geometry.test.ts」只驗證「color attribute 綁定到 geometry」，但 Material 本身的設定從未驗證。

### 應該包括但缺失的內容
```
- meshStandardMaterial 基礎設定
  • side 屬性（single-sided vs double-sided）
  • Color space（sRGB vs linear）
  • vertexColors 屬性是否啟用
  • 其他關鍵屬性（roughness、metalness 初值）

- 法線與著色相關
  • computeVertexNormals() 已執行
  • 法線計算結果正確

- Material 與 Mesh 的綁定
  • Material 正確套用到 Mesh
  • 屬性變更後是否正確反映
```

### 為什麼重要
- Material 設定錯誤會導致：
  - 顏色失真（color space 問題）
  - 光照異常（法線錯誤）
  - 背面裸露（side 設定）
- 這類錯誤在「map : canvas」運行時才發現成本很高

### 建議補充

```markdown
- Material & Geometry 預準備

  功能目的：確認地形 Mesh 的材質與幾何綁定正確。

  測試內容：
  - Material 類型正確（meshStandardMaterial）
  - side 設定（single / double）
  - Color space（sRGB / linear）
  - vertexColors attribute 已綁定
  - 法線計算已執行且結果正確
  - Material 套用到 Mesh 後視覺反應正確

  驗證條件：
  - Material 綁定後光照反應符合預期
  - 顏色、光影無異常
  - 幾何與材質無衝突
```

---

## 🔴 缺口 3：性能預算檢查缺失

### 問題描述
Render preparation 中沒有「交付前性能預算驗證」。Performance 項目只在「map : canvas」的運行時檢查。

### 應該包括但缺失的內容
```
- 頂點數預算檢查
  • 目標 FPS 對應的預算（例如 60fps 預算多少頂點）
  • 當前配置頂點數是否超預算

- Draw call 數估算
  • 一個地形 mesh = 1 draw call（InstancedMesh 可進一步優化）
  • 其他層（POI、測站等）的 draw call 數

- 紋理記憶體估算
  • 若使用紋理，記憶體占用
  • 不同品質模式下的記憶體差異

- 硬體相容性預估
  • 目標環境（手機、平板、桌機）
  • 各設備的效能預期
```

### 為什麼重要
- 高度地形（256×256 ~ 1080×1080 網格）可能有數百萬個頂點
- 若交付前不檢查，運行時才發現卡頓已無法回頭
- 效能降級（低/中/高品質）決策應在 Render preparation 定義

### 建議補充

```markdown
- 性能預算驗證（交付前檢查）

  功能目的：確保交付的配置符合效能目標。

  測試內容：
  - 頂點數是否超過目標 fps 對應的預算
  - Draw call 數計算與評估
  - 紋理記憶體估算
  - 預估 60fps 下的硬體需求
  - 不同品質預設的效能差異

  驗證條件：
  - 配置符合目標設備能力
  - 超預算時觸發降級方案
  - 各品質模式下效能可預測
```

---

## 🔴 缺口 4：初始化順序與相依性無明文

### 問題描述
各項獨立列舉，沒有明確的執行順序與相依鏈。

### 應該明文化的依賴關係
```
1️⃣ Renderer 初始化
   ↓ 決定能支援的特性（WebGL 2.0、擴展等）
2️⃣ Scene 初始化
   ↓ 建立容器、設定背景/霧
3️⃣ Camera 初始化
   ↓ 設定視角、視錐、位置
4️⃣ Material 預準備
   ↓ 檢查材質設定、法線計算
5️⃣ Canvas 設定
   ↓ 確認尺寸與 DPR、resize 監聽
6️⃣ Lighting 預設
   ↓ 設定光源、陰影參數
7️⃣ 性能預算驗證
   ↓ 確認符合目標
8️⃣ 系統進入「可渲染狀態」
```

### 為什麼重要
- 若順序亂了（例如 Canvas 尺寸先設定再 Renderer 初始化），DPR 計算會出錯
- 若 Camera FOV 超過 Scene 邊界會導致超出視景的物件也被渲染

### 建議補充
在 Render preparation 開頭加上流程圖或時序說明。

---

## 🔴 缺口 5：初始化失敗與降級機制缺失

### 問題描述
完全沒有容錯定義。若某個環節失敗，沒有明確的回復策略。

### 應該包括但缺失的內容
```
- Canvas 不支援 WebGL
  → fallback 策略（提示或降級至 canvas 2D）

- Material 載入失敗
  → 用預設顏色或單色渲染

- 記憶體不足
  → 自動降低解析度、禁用陰影

- 相機互動衝突
  → 使用保守限制值

- Renderer 初始化失敗
  → 明確的錯誤堆棧與建議
```

### 為什麼重要
- 異常環境（舊瀏覽器、低端設備、記憶體不足）下沒有降級方案會導致完全黑屏
- 使用者體驗會大幅下降

### 建議補充

```markdown
- 初始化失敗與降級機制

  功能目的：確保系統在異常環境下能安全降級而非崩潰。

  測試內容：
  - Canvas 不支援 WebGL → fallback 策略
  - Material 載入失敗 → 預設顏色渲染
  - 記憶體不足 → 自動降解析度
  - 相機設定衝突 → 使用保守值
  - 錯誤訊息與診斷

  驗證條件：
  - 系統不因單點失敗而完全崩潰
  - 降級後仍可操作與顯示
  - 錯誤訊息明確易排查
```

---

## 🟡 不合理 1：Camera 混合「初始化」與「互動」

### 問題描述
```
「相機初始姿態、縮放範圍、旋轉限制、拖曳與視角切換」
```
這行文字混淆了兩件不同的事。

### 為什麼不合理
- **初始化（交付前）**：位置、方向、FOV、視錐（near/far plane）
  - 這是 Render preparation 應該驗證的

- **互動限制（運行時）**：旋轉/拖曳/縮放的範圍限制
  - 這應該在「map : canvas」的「Camera / interaction / controls」驗證

### 建議改為

```markdown
- Camera 初始化

  功能目的：確認相機的基礎設定與視錐正確。

  測試內容：
  - 相機位置、方向、目標點設定正確
  - FOV 值合理（通常 50~75°）
  - 視錐（near plane、far plane）覆蓋地形範圍
  - 縱橫比（aspect ratio）與 canvas 一致

  驗證條件：
  - 相機視野能完整覆蓋地形
  - 視錐邊界設定合理

- Camera 互動約束（移至 map : canvas）

  功能目的：確認使用者操作範圍的限制。

  測試內容：
  - 旋轉範圍限制（例如俯仰角 -80° ~ 80°）
  - 縮放倍數範圍（例如 1× ~ 5×）
  - 拖曳邊界（防止相機飛出地形外）
  - 視角切換行為（orthographic vs perspective）

  驗證條件：
  - 互動限制防止視角超出預期
```

---

## 🟡 不合理 2：「解析度切換」邊界不清

### 問題描述
Render preparation 有「解析度切換」，map : canvas 也有「解析度切換壓力測試」。

### 為什麼不合理
- 職責邊界混亂
- 可能導致重複測試

### 建議改為

**Render preparation 中**：
```markdown
- 品質模式與解析度預設

  功能目的：定義並驗證不同品質模式的配置。

  測試內容：
  - 品質模式定義（low / medium / high）
  - 各模式對應的解析度、特性禁用清單
  - 預設品質的完整配置（geometry grid size、shader complexity、shadow resolution）

  驗證條件：
  - 品質模式定義清晰
  - 預設品質配置正確
```

**map : canvas 中**（運行時）：
```markdown
- 解析度切換穩定性測試

  功能目的：確認運行時切換品質時系統穩定。

  測試內容：
  - 切換品質時 geometry、camera、renderer 重配置
  - 切換過程中是否有 flicker 或中斷
  - 切換後互動仍正常

  驗證條件：
  - 切換不中斷使用者操作
  - 視覺過渡平順
```

---

## 🟡 不合理 3：光影設定混淆「預設」與「動態」

### 問題描述
```
「檢查 light、shadow、time of day / environment 設定是否正確套用」
```
混淆了「預設值」與「動態控制」。

### 為什麼不合理
- **Light 強度、方向** = 交付前確定的預設值
- **Time of day 動態變化** = 可能是運行時功能，不是交付前驗證

### 建議改為

```markdown
- 光影與場景參數

  功能目的：確認光源與陰影的預設設定正確。

  測試內容：
  - 主光源方向、顏色、強度設定
  - 環境光（ambient light）強度
  - 陰影參數（shadow map resolution、near/far）
  - 光源與地形交互的視覺效果
  - （可選）時間參數架構，若支援動態光照

  驗證條件：
  - 光影效果符合視覺設計
  - 陰影精度與效能平衡
  - 預設光照下地形細節可讀
```

---

## 🟡 不合理 4：「渲染器相容性與效能準備」過於寬泛

### 問題描述
```
「renderer 設定、device pixel ratio、fallback、性能優化與場景初始化」
```
混了 4~5 件不相關的事。

### 為什麼不合理
- **環境檢測** vs **Renderer 設定** vs **性能優化** = 三個獨立關注點
- 應該分層清晰

### 建議分拆為

```markdown
- Renderer 初始化與環境檢測

  功能目的：確認 Renderer 能正常建立、支援哪些特性。

  測試內容：
  - Canvas 支援 WebGL 檢查
  - WebGL 版本偵測（1.0 vs 2.0）
  - 環境特性偵測（支援的擴展、著色器精度）
  - 初始化失敗時的 fallback 策略

  驗證條件：
  - Renderer 成功建立或正確 fallback
  - 環境特性用於下游品質決策

- Renderer 基礎設定

  功能目的：確認 Renderer 的核心參數正確。

  測試內容：
  - Antialias 設定
  - Precision（低精度 vs 高精度）
  - Pixel ratio 正確應用
  - Tone mapping、exposure 默認值

  驗證條件：
  - Renderer 設定與 Canvas 配置同步
  - 視覺效果無異常

- 性能預算驗證（已在缺口 3 中詳述）
```

---

## ✅ 已標記重複但需移除

### 重複 1：「渲染座標與地形顏色設定」

**現狀**：已加上重複標記，但項目仍在清單中。

**建議**：直接刪除此項（內容已在第 1 項 terrain-geometry.test.ts 驗證）。

---

### 重複 2：「Resolution / quality modes」

**現狀**：已加上重複標記，但項目仍在清單中。

**建議**：直接刪除此項，改用「品質模式與解析度預設」（參見不合理 2）。

---

## 📋 完整缺口與不合理統計表

| 類別 | 項目 | 問題 | 優先級 | 建議行動 |
|------|------|------|--------|---------|
| 🔴 缺口 | Scene 層級初始化 | 完全缺失 background/fog/ambient light | **高** | 新增項目 |
| 🔴 缺口 | Material 綁定驗證 | 只測 geometry，未測 material 設定 | **高** | 新增項目 |
| 🔴 缺口 | 性能預算檢查 | 沒有交付前預算驗證 | **高** | 新增項目 |
| 🔴 缺口 | 初始化順序 | 依賴鏈無明文 | **中** | 新增流程說明 |
| 🔴 缺口 | 初始化失敗機制 | 沒有容錯/降級定義 | **中** | 新增項目 |
| 🟡 不合理 | Camera | 混合初始化與互動 | **中** | 分拆為 2 項 |
| 🟡 不合理 | 解析度切換 | 邊界與 map : canvas 重複 | **中** | 重新定義職責邊界 |
| 🟡 不合理 | 光影設定 | 預設值與動態控制未區分 | **低** | 澄清職責邊界 |
| 🟡 不合理 | Renderer 相容性 | 過於寬泛，應分層 | **中** | 分拆為 3 項 |
| 🔴 已標記 | 渲染座標與地形顏色 | 重複但未移除 | **低** | 刪除 |
| 🔴 已標記 | Resolution / quality modes | 重複但未移除 | **低** | 刪除 |

---

## 核心評估結論

### 現狀問題

| 層面 | 評估 |
|------|------|
| **流程完整性** | ❌ 缺少 5 個關鍵層次（Scene、Material、性能、容錯、順序） |
| **職責邊界** | ❌ 與 map : canvas 的邊界模糊，重複項未清除 |
| **概念清晰度** | ⚠️ 混淆「預設配置」與「運行時控制」（Camera、光影、解析度） |
| **邏輯層次** | ❌ Renderer 相容性過於寬泛，應分為環境偵測、設定、效能 3 層 |

### 建議調整方向

**Render preparation 應調整為「交付渲染前的完整準備檢查清單」，而非「配件檢查」**

關鍵調整：
1. ✅ 新增 Scene、Material、性能、容錯 4 個缺失層次
2. ✅ 刪除已標記的 2 項重複
3. ✅ 分拆混淆項（Camera、光影、Renderer）
4. ✅ 明文化初始化順序與依賴鏈
5. ✅ 澄清與 map : canvas 的職責邊界

---

## 引用

| 文件 | 路徑 | 用途 |
|------|------|------|
| Data-transformation-layer.txt | `/docs/test/software development flow/` | 第 2 項定義 |
| 3Dmap-test-define.md | `/docs/test/software development flow/` | map : canvas 定義 |
| Phase-2-Render-Prep-Analysis.md | `/docs/test/software development flow/` | 前期重複分析 |

