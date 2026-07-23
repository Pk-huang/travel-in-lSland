# POI 圖釘校正流程紀錄

更新日期：2026-07-22

## 目標

- 釐清 POI 圖釘為何偏離景點位置
- 確認問題來自座標、地形方向，還是 HTML 圖釘錨點
- 建立後續可持續維護的 POI 校正資料結構

## 問題現象

- POI 圖釘膠囊與景點視覺位置明顯偏移
- 初步觀察像是圖釘往下偏，但需要確認是資料、地形或 CSS 錨點造成

## 排查過程

### 1. 加入 POI debug 紅點

- 在 `PoiLayer` 的真實世界座標位置渲染小紅點
- 目的：分辨是 `MapMarkerTag` 的 HTML 錨點偏移，還是世界座標本身有問題

觀察結果：

- 紅點也偏移，因此可排除純 `Html` 錨點問題

### 2. 加入 bbox / 四角 debug

- 在地圖上標記 `NW / NE / SW / SE / CENTER`
- 目的：驗證 `coords.ts` 的 bbox 與地圖整體投影是否正確

觀察結果：

- bbox 四角整體是對的
- 代表 `coords.ts` 的外框投影並沒有整體錯位

### 3. 驗證 POI 與 DEM 是否為同一座標系

- 檢查 `lonLatToSceneXZ` 與地形平面的映射關係
- 檢查 `Terrain` 寫頂點時的 row 方向，以及 `sampleElevationMeters` 的取樣方向

觀察結果：

- 問題不是單純 POI 資料語意
- 真正根因是 **地形南北方向翻轉**

### 4. 修正地形南北翻轉

修正內容：

- `Terrain` 以 `north -> south` 的 row 順序解讀 DEM
- `sampleElevationMeters` 改為同樣的 `north -> south` 取樣方向
- 讓地形渲染與 POI / weather / road 的高度取樣一致

修正結果：

- 紅點回到正確景點位置
- 代表世界座標鏈路已經打通

### 5. 修正圖釘延長線錨點

問題：

- 紅點正確後，膠囊圖釘仍因 `Html center` 錨在「整個元件中心」而偏離

修正內容：

- `MapMarkerTag` 移除 `Html center`
- 改成用 CSS `translate3d(-50%, -100%, 0)` 將圖釘錨在「底部中心」

結果：

- 延長線底端改為對準真實落點

### 6. 短期視覺微調

- 將 POI 圖釘整體向上提高 50%
- 目的：改善膠囊與地形視覺間距

## 最終結論

根因優先序如下：

1. DEM 地形南北翻轉
2. `MapMarkerTag` 的 HTML 錨點設計不對
3. POI 個別 `displayLocation` 僅作為少數景點微調保留手段，不是主根因

## 目前保留的資料結構

已加入：

- `PoiSeedRecord.displayLocation?: { lat: number; lon: number }`

用途：

- 讓未來若個別景點仍需人工微調，可直接覆寫顯示用座標
- 正常情況下仍以主座標系與 DEM 對齊為優先

## 後續 CRUD 準備

### 建議資料欄位

POI 至少需要以下欄位可支援校正 CRUD：

- `poiId`
- `name.zhHant`
- `name.en`
- `location.lat`
- `location.lon`
- `displayLocation.lat`（可選）
- `displayLocation.lon`（可選）
- `updatedAt`（若未來做後台編修，建議加）
- `updatedBy`（若未來多人維護，建議加）

### CRUD 行為建議

1. Create
- 新增 POI 時必填原始 `location`
- `displayLocation` 可先留空

2. Read
- 前台渲染優先讀 `displayLocation`
- 若無 `displayLocation`，回退到 `location`

3. Update
- 僅調整顯示位置時，只改 `displayLocation`
- 不覆蓋原始 `location`

4. Delete
- 刪除 POI 時同步移除 `displayLocation`

### 管理流程建議

1. 先以 seed 檔維護
- 適合目前小規模 featured POI

2. 下一階段再做後台表單或 JSON 編輯介面
- 輸入景點 ID
- 顯示目前 `location` / `displayLocation`
- 可直接更新 `displayLocation`

3. 若日後擴充為資料庫
- `displayLocation` 應與 `location` 分欄存放
- 不要覆蓋原始來源座標

## 本次相關檔案

- `src/lib/map/coords.ts`
- `src/components/map/Terrain.tsx`
- `src/components/ui/map-marker-tag.tsx`
- `src/components/map/PoiLayer.tsx`
- `src/lib/config/poi-seeds.ts`
- `src/lib/config/poi.ts`
- `src/lib/client/use-featured-pois.ts`

## 備註

- 本次確認「地形正向」比「手調 POI 座標」更重要
- 若未來再次出現整批 POI 偏移，優先重查 DEM row order 與投影鏈，而不是先調 `displayLocation`