# 極光（Northern Lights）API 研究

**更新日期：** 2026-06-18

---

## 1. 快速結論

就極光功能而言，目前最可行的公開組合是：

1. NOAA 極光預報 JSON
2. Vedur weather API（提供冰島雲量／能見度背景）
3. Vedur 北極光頁（僅作參考）

目前沒有明確且穩定、可公開使用的 Vedur 極光指數或 Kp JSON API 文件。

---

## 2. 最佳公開極光來源

### NOAA SWPC 極光預報 JSON

- **URL:** https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
- **型態：** 公開 JSON
- **驗證：** 無需驗證
- **用途：** 極光機率、極光帶、地圖視覺化、提醒邏輯

### 為什麼建議使用

- 機器可讀
- 可直接用 Postman 測試
- 適合做全球尺度的極光活動訊號

---

## 3. 冰島在地參考頁面

### Vedur 北極光頁面

- **URL:** https://vedur.is/vedur/spar/nordurljos/
- **型態：** 公開網頁
- **狀態：** 非官方文件化 JSON API
- **用途：** 冰島在地北極光預報參考

---

## 4. 極光資料建議搭配項目

極光可見性同時受在地天氣條件影響。

建議搭配 Vedur 的：

- 雲量
- 風速
- 降水
- 能見度相關背景
- 測站與區域覆蓋資訊

常用 Vedur 端點：

- https://api.vedur.is/weather/openapi.json
- https://api.vedur.is/weather/capabilities
- https://api.vedur.is/weather/stations?region_id=12
- https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic

---

## 5. Postman 測試 URL

### NOAA 端點

- **GET** https://services.swpc.noaa.gov/json/ovation_aurora_latest.json

### Vedur 端點

- **GET** https://api.vedur.is/weather/openapi.json
- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
- **GET** https://api.vedur.is/weather/stations?region_id=12
- **GET** https://vedur.is/vedur/spar/nordurljos/

### 建議 headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 6. NOAA JSON 結構範例

```json
{
  "Observation Time": "2026-06-18T08:11:00Z",
  "Forecast Time": "2026-06-18T09:14:00Z",
  "Data Format": "[Longitude, Latitude, Aurora]",
  "coordinates": [
    [0, 64, 2],
    [1, 64, 3],
    [2, 64, 4]
  ]
}
```

### 重要欄位

| 欄位 | 說明 |
|---|---|
| `Observation Time` | 最新觀測時間 |
| `Forecast Time` | 預報生成時間 |
| `Data Format` | 座標資料格式 |
| `coordinates` | 極光強度網格 |

---

## 7. 實務限制

- NOAA 是全球資料，不是專為冰島設計。
- Vedur 北極光頁可參考，但不屬於穩定 API 契約。
- Kp 值目前未見明確公開且專用的 Vedur 端點。
- 產品上線時建議先整合極光與天氣，再輸出對使用者的建議。

---

## 8. 建議 MVP 邏輯

1. 讀取 NOAA 極光 JSON。
2. 讀取 Vedur 冰島天氣資料。
3. 合併為單一結果。
4. 輸出簡化狀態：
  - 極光機率高
  - 有機會觀測
  - 可能被雲層遮蔽
  - 極光機率低

---

## 9. 總結

- **極光主資料：** NOAA（可用）
- **冰島天氣補充：** Vedur（可用）
- **穩定公開 Vedur 極光 API：** 目前未確認
