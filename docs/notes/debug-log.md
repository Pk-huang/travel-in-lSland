# Debug Log

用途：集中記錄本專案所有除錯紀錄，避免每次問題各自散落成單獨檔案。主進度檔只保留摘要與連結，完整脈絡統一收在此處。

---

## 2026-07-08 日照模型閃爍除錯

### 問題現象

- 使用者在 07/08 10:00 ~ 11:36 拖動時間軸時，觀察到光照偶發「突然變亮又立刻變暗」。
- 右上角 debug 值可見 `day` 與 `sun` 在短時間內大幅跳動。
- 視覺感受不是太陽方向跳躍，而是亮度短促尖峰。

### 初始架構

當時前端 `Lighting` 內同時存在兩條光照計算路徑：

1. `daylightFromSun`
- 依第三方 sunrise / sunset / twilight 邊界計算

2. `fallbackDaylight`
- 依系統時間的舊正弦公式近似白天夜晚

設計初衷是保底容錯：
- 有第三方資料時，逐步接到真實日照
- 第三方資料失效時，仍能退回近似模型，避免白屏或整體失真

但這兩條路徑在資料可用時仍被混合，成為後續閃爍的根因。

### 除錯時間線

#### 1. 獨立接入第三方日照資料

- 新增獨立路由 `/data/sun-times`
- 新增第三方 client：Sunrise-Sunset API
- 新增型別與 schema，驗證上游回傳欄位

目的：先確認第三方日照資料本身可穩定取得，而不是直接混進既有 BFF 難以分辨問題來源。

#### 2. 併入 BFF 並建立三天邊界

- 將 `sun` 併入 `/data/iceland-status`
- 擴充成三天邊界：`previous / current / next`
- 目標是支援跨午夜連續插值，避免 23:59 → 00:01 方向斷裂

#### 3. 前端改吃三天邊界

- `Lighting` 改為優先使用 `sunBoundary`
- 以 sunrise / sunset / civil twilight 推導 `daylight` 與 `sunAngle`
- `MapCanvas` debug 同步走同一條計算路徑

#### 4. 使用者回報日出日落仍有閃爍

觀察結果：
- 閃一下是亮度瞬間升高再降低
- 比較不像太陽方向錯誤，較像輸入值在切換

#### 5. 加入追蹤日誌

在 [src/components/map/Lighting.tsx](src/components/map/Lighting.tsx) 加入 threshold-based debug log：

- `daylightFromSun`
- `fallbackDaylight`
- `contextSource`
- `legacySunAngle`
- `targetSunAngle`
- 跳變前後的 `daylight / sunIntensity / ambientIntensity`

只有在數值跳變超過門檻時才輸出，避免 console 洗版。

#### 6. 從 log 確認根因

實際觀察到：
- `daylightFromSun` 偏低
- `fallbackDaylight` 偏高
- 同一個 `selectedTime` 會被兩套模型各算一次，再混成最終值

結論：
- 問題不是曲線函數本身錯誤
- 問題是「同一時間，同時走真實日照模型與近似 fallback 模型」
- 兩者在某些時刻差距過大，混合後產生亮度尖峰

### 根因定位

#### 表面問題

- 光照亮度偶發跳變

#### 真正原因

- 前端存在雙路模型混算
- 同一個 `selectedTime` 被兩種方法各算一次：
	- 真實日照邊界模型
	- 系統時間近似模型
- 最終做混合時，輸入差異過大造成閃爍

#### 補充說明

時間參數其實只有一個，不是有兩個時間來源。

真正有兩條的是「計算路徑」：

1. `selectedTime -> daylightFromSun`
2. `selectedTime -> fallbackDaylight`

也就是同一個時間，被兩個模型各自解讀一次。

### 修正決策

#### 決策原則

後端先決定唯一有效來源，前端只吃一條路徑，不再自己混算。

#### 新架構：單一路徑 `sunModel`

在 BFF 新增 `sunModel`：

```ts
type SunLightingModel = {
  source: "sun" | "fallback";
  tzid: string;
  boundary: SunLightingBoundary | null;
  fallbackReason?: string;
};
```

當第三方資料有效時：
- `source = "sun"`
- 後端先清洗並輸出有效邊界 timestamp

當第三方資料無效時：
- `source = "fallback"`
- 前端只走舊公式，不和 `sun` 路徑混用

#### 後端責任

- 清洗 `1970...` sentinel
- 決定有效邊界
- 補上跨午夜需要的前一天日落 / 隔天日出
- 決定 `source = sun | fallback`

#### 前端責任

- 只依 `sunModel.source` 走單一路徑
- `sun` 路徑：只用 `boundary` 計算
- `fallback` 路徑：只用近似公式計算

### 實作變更摘要

#### 後端

- [src/app/data/sun-times/route.ts](src/app/data/sun-times/route.ts)
- [src/lib/api/sun-times.ts](src/lib/api/sun-times.ts)
- [src/app/data/iceland-status/route.ts](src/app/data/iceland-status/route.ts)
- [src/types/domain.ts](src/types/domain.ts)
- [src/schemas/domain.ts](src/schemas/domain.ts)

#### 前端

- [src/components/map/Lighting.tsx](src/components/map/Lighting.tsx)
- [src/components/map/MapCanvas.tsx](src/components/map/MapCanvas.tsx)
- [src/components/timeline/TimelineControl.tsx](src/components/timeline/TimelineControl.tsx)
- [src/lib/store/workspace.ts](src/lib/store/workspace.ts)

### 驗證結果

- `get_errors`：通過
- `corepack pnpm lint`：通過
- `corepack pnpm build`：通過
- `home:200`：通過
- BFF 實測：`/data/iceland-status?region=south` 已回 `sunModel.source = sun`

### 後續觀察點

1. 重新驗證 07/08 10:00 ~ 11:36 是否仍有亮度突刺
2. 若仍有問題，下一步直接比對 `sunModel.boundary` 在特定時間的輸入值
3. 不再回頭調整雙路混合，因該根因已移除

### 一句結論

這次日照閃爍的根因不是函數曲線，而是「同一個時間被兩套模型同時計算並混合」。最終解法是把來源決策移回後端，前端只走單一路徑 `sunModel`。
