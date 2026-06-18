# 功能需求記錄模板

> 文件角色：功能級規格模板（按鈕/元件/流程統一格式）
>
> 維護規則：每新增功能先複製本模板填寫，再進入開發

> 用這個模板記錄每一個功能、元件、按鈕，從簡單到複雜都適用

---

## 簡單例子：「飛到景點」按鈕

### 基本資訊
- **功能名稱**：飛到景點按鈕
- **優先級**：P1（核心）
- **所屬模組**：3D 場景 / 行程面板
- **狀態**：Planning

### 功能描述
點擊按鈕後，3D 相機平滑飛向該景點位置，並在左側顯示景點卡片。

### 視覺設計
- **位置**：ItineraryPanel 的每一行右側
- **大小**：40px × 40px（圖示按鈕）
- **圖標**：📍 或自訂 SVG
- **樣式**：
  - 預設：灰色背景，白色圖示
  - Hover：根據風險等級變色（低風險綠、中等黃、高風險紅）
  - Active：加陰影

### 功能流程

```
使用者點擊 "飛到黑沙灘"
    ↓
觸發 onClick 事件
    ↓
[計算相機位置]
  - 目標座標 (lat, lon)
  - 視距 2000m
  - 俯視角度 45°
    ↓
[更新 Zustand: cameraStore.flyToPoint()]
    ↓
[3D 場景收到更新]
  - 相機 2 秒內 lerp 平滑移動
  - 同時更新 lookAt 指向目標
    ↓
[左側面板更新]
  - 展開該景點的卡片
  - 顯示景點名、時間、風險等級
    ↓
完成
```

### 相關程式模組

**前端檔案**
| 檔案 | 做什麼 |
|------|--------|
| `src/components/ItineraryPanel.tsx` | 顯示行程列表 + 按鈕渲染 |
| `src/components/ItineraryItem.tsx` | 單項行程 + 按鈕 onClick |
| `src/hooks/useCameraControl.ts` | 相機動畫邏輯 |
| `src/store/camera.ts` | 相機狀態（目標座標、動畫中..） |
| `src/components/Scene3D.tsx` | 監聽相機狀態，驅動 Three.js |

**資料流向**
```
ItineraryItem (button click)
    ↓
useCameraStore.flyToPoint({ lat, lon })
    ↓
cameraStore.target 更新
    ↓
Scene3D useFrame() 監聽 → lerp 畫面
    ↓
相機平滑飛行完成
```

### 驗收標準

- [ ] 按鈕點擊後相機 2 秒內飛到目標點
- [ ] 目標點座標準確誤差 < 50m
- [ ] 飛行過程中不卡頓（FPS >= 45）
- [ ] 手機端點擊有 feedback (顏色變化或震動)
- [ ] Hover 時出現 tooltip 顯示景點名

### 測試場景

| 場景 | 測試方法 |
|------|--------|
| 正常飛行 | 點擊任意景點，確認飛到 |
| 連續點擊 | 快速點擊 2 個景點，第二次飛行應中斷第一次 |
| 手機 FPS | 用 DevTools 監控，應保持 >= 45 FPS |
| 邊界情況 | 點擊最北端景點 + 最南端景點 |

---

## 中等複雜例子：「時間軸拖拽與場景更新」

### 基本資訊
- **功能名稱**：時間軸拖拽聯動 3D 光影
- **優先級**：P1
- **所屬模組**：UI 控制 / 3D 場景
- **相依性**：需要 Weather API + Sun 光源模型
- **狀態**：Design Review

### 功能描述
使用者在底部時間軸拖拽時，3D 場景的光影與天氣狀態即時更新（模擬時間推進）。

### 視覺設計
- **時間軸位置**：底部固定條
- **軌跡長度**：視窗寬度 80%
- **滑塊**：圓形，直徑 24px，顏色跟隨日光（藍/金/紅）

### 功能流程

```
使用者拖動時間軸滑塊
    ↓
觸發 onDrag 事件 → 計算時間偏移
    ↓
[更新 timeStore.selectedTime]
    ↓
[3D 場景監聽 selectedTime]
  - 調整太陽方向
  - 更新環境光強度
  - 移動陰影
    ↓
[Weather Layer 也監聽]
  - 根據新時間讀取 weather 預測資料
  - 更新雲層、雨滴
    ↓
完成
```

### 相關程式模組

**前端檔案**
| 檔案 | 功能 |
|------|------|
| `src/components/Timeline.tsx` | 時間軸元件 + 拖拽邏輯 |
| `src/store/time.ts` | selectedTime 狀態 |
| `src/components/LightSource.tsx` | 太陽光源（根據時間旋轉） |
| `src/components/CloudLayer.tsx` | 雲層粒子（根據時間和天氣更新） |

### 驗收標準

- [ ] 拖拽平滑無卡頓（FPS >= 60）
- [ ] 光影更新延遲 < 200ms
- [ ] 12 小時時間範圍內光影變化逼真
- [ ] 手機端可拖拽
- [ ] 若网路不穩，氣象資料應用本地快取

---

## 複雜例子：「AI 行程生成與 3D 同步」

### 基本資訊
- **功能名稱**：AI 行程生成
- **優先級**：P0（MVP 核心）
- **所屬模組**：AI 服務 / 前端 UI / 3D 場景
- **相依性**：BFF `/api/generate-itinerary` + Vedur API + Road API
- **狀態**：Development

### 功能描述
使用者輸入旅遊偏好，系統使用 LLM 根據當地天氣/道路狀況生成可執行的一日行程，並在 3D 地圖上標記景點。

### 功能流程

```
使用者輸入 + 點擊「生成」
    ↓
[前端調用 /api/generate-itinerary]
  POST { userInput, weather, roads }
    ↓
[BFF 後端]
  - 讀取 system prompt v1
  - 呼叫 OpenAI GPT-4
  - 流式返回結果
    ↓
[前端監聽串流]
  - 逐行解析 JSON
  - 即時渲染進度條
    ↓
[行程 JSON 完整後]
  - 儲存到 itineraryStore
  - 抽出景點座標
  - 在 3D 場景生成錨點球體
    ↓
[使用者互動]
  - 點擊行程卡片 → 飛到景點
  - 拖動時間軸 → 該時段的天氣迴圈
    ↓
完成
```

### 相關程式模組

**後端**
| 檔案 | 功能 |
|------|------|
| `app/api/generate-itinerary/route.ts` | 主 API 路由 |
| `lib/ai/prompts.ts` | AI Prompt 定義 |
| `lib/ai/validators.ts` | 行程合法性檢驗（景點是否真實） |

**前端**
| 檔案 | 功能 |
|------|------|
| `src/hooks/useItineraryGeneration.ts` | 調用 API + 流式解析 |
| `src/components/ItineraryPanel.tsx` | UI 面板 |
| `src/store/itinerary.ts` | 行程狀態 |
| `src/components/AnchorPoint.tsx` | 3D 景點球體 |

**資料契約**
```typescript
// 請求
POST /api/generate-itinerary
{
  userInput: string;
  weather: WeatherData[];
  roads: RoadData[];
  promptVersion?: 'v1' | 'v2';
}

// 回應（串流 JSON Lines）
{
  title: "南岸冬日秘境行"
  riskScore: 45
  items: [
    {
      time: "08:00"
      title: "黑沙灘"
      lat: 63.88
      lon: -19.03
      risk: "low"
    }
  ]
}
```

### 驗收標準

- [ ] 從輸入到行程顯示 < 10 秒
- [ ] AI 生成的景點名 100% 在官方清單內
- [ ] 3D 錨點座標精度 < 100m
- [ ] 行程總時間 <= 12 小時
- [ ] 高風險路段有警告標記

---

## 如何用這個模板

### 新功能新增流程

1. **規劃階段**：填 `基本資訊` + `功能描述`
2. **設計階段**：補 `視覺設計`
3. **開發前**：補 `功能流程` + `相關程式模組`
4. **開發中**：更新 `狀態` 為 Development
5. **PR Review**：檢查 `驗收標準` 是否都做到

### 多人協作時

- 產品經理寫 1-3 項
- 設計師補充 `視覺設計`
- 前端工程師補充 `相關程式模組` + `資料契約`
- Code Review 時檢查 `驗收標準`

### 快速查看進度

```
📋 正在進行中的功能
- [ ] 飛到景點按鈕 (ItineraryItem.tsx)
- [ ] 時間軸拖拽 (Timeline.tsx)
- [x] AI 行程生成 (useItineraryGeneration.ts + API)

⏰ 下週優先做
- 手勢隔離 (行動端點擊衝突)
- Web Worker 路徑校準
```

