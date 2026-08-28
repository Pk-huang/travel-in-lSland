# 第 2 項「Render preparation / compatibility」重複分析與規劃

## 重複檢查清單

### ❌ 明確重複 - 應刪除或改為集成測試

#### 1. 「渲染座標與地形顏色設定」vs 第 1 項第 3-4 小項

**第 1 項已測試內容**（coords.test.ts, terrain-color.test.ts, terrain-geometry.test.ts）：
- ✅ `lonLatToSceneXZ()` 座標轉換函式邏輯
- ✅ `elevationToSceneY()` 高度映射函式邏輯  
- ✅ `worldCoverBaseColor()` 顏色映射函式邏輯
- ✅ `PlaneGeometry` + 頂點位置 + 顏色 attribute 綁定

**第 2 項「渲染座標與地形顏色設定」的陳述**：
- 驗證座標系統、地形高度映射、顏色資料與 mesh geometry 是否對齊

⚠️ **重複程度**：90% 重複。第 1 項已測單個函式邏輯，第 2 項再測一次「資料是否對齊」是重複工作。

**建議方案**：
- 刪除此項，或改為「場景集成驗證」（integration test）
- 新目的：驗證「terrain mesh 加入場景後，相對於相機視角、光照的位置是否正確」
- 改名：「Terrain mesh 場景集成驗證」

---

#### 2. 「Resolution / quality modes」vs 「解析度切換」

**重複程度**：95% 重複。檔案中明確註記：「與下方『解析度切換』測試目的高度重疊，採同一組解析度切換證據」。

**建議方案**：
- 刪除「Resolution / quality modes」
- 只保留「解析度切換」

---

### ⚠️ 可能重複 - 需確認邊界

#### 3. 「Camera / interaction spec」

**第 1 項相關**：無直接重複（座標轉換不涉及相機）

**但需確認邊界**：
- 相機的 near/far plane、FOV 等基礎設定是否在這裡測？
- 還是只測互動行為（旋轉、拖曳、縮放）？

**建議測試方式**：E2E 或 component test（需實際操作相機）

---

#### 4. 「畫布大小、viewport、DPR 設定」

**第 1 項相關**：無直接重複

**邊界清晰**：純粹 Canvas/Renderer component 的響應式設定

**建議測試方式**：Component test（模擬 resize、檢查 canvas.width、canvas.height、renderer.getPixelRatio()）

---

#### 5. 「光影、時間與場景參數」

**第 1 項相關**：無直接重複（地形只負責座標/顏色）

**邊界清晰**：場景級光源設定

**建議測試方式**：Integration test（修改 light 參數，檢查地形陰影變化）

---

#### 6. 「渲染器相容性與效能準備」

**第 1 項相關**：無直接重複

**邊界清晰**：Renderer 初始化與環境檢測

**建議測試方式**：Component test 或 integration test

---

## 重新規劃的第 2 項

### 去重後保留項目

| 項目 | 測試檔 | 測試類型 | 測試內容 | 備註 |
|------|------|--------|--------|------|
| **Terrain mesh 場景集成驗證** | terrain-scene.test.ts | Integration | terrain mesh 在場景中的位置、方向、光照應用 | ✅ 不重複第 1 項（第 1 項只測座標/顏色函式） |
| **Camera 初始化與互動限制** | camera.test.ts 或 E2E | E2E / Component | 相機姿態、縮放範圍、旋轉限制 | ✅ 新範疇 |
| **Canvas 響應式與 DPR** | canvas.test.ts | Component | viewport、尺寸、DPR、resize 重算 | ✅ 新範疇 |
| **解析度切換** | resolution-switch.test.ts | Integration | 切換解析度時 geometry、camera、renderer 重配置 | ✅ 新範疇；去掉 Resolution / quality modes |
| **光影與場景參數** | lighting.test.ts | Integration | light、shadow、time of day 套用結果 | ✅ 新範疇 |
| **Renderer 初始化** | renderer.test.ts | Component / Integration | renderer 設定、環境檢測、fallback | ✅ 新範疇 |

### 刪除項目

| 項目 | 原因 |
|------|------|
| 「渲染座標與地形顏色設定」| 90% 與第 1 項重複（coords/terrain-color/terrain-geometry test）|
| 「Resolution / quality modes」 | 100% 與「解析度切換」重複 |

---

## 下一步行動

1. **確認第 2 項應調整為上表所列** ✓
2. 各項逐一規劃測試內容與驗證條件
3. 標註各項的測試方式（Unit / Component / Integration / E2E）

