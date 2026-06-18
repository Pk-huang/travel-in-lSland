# Postman 快速上手

**更新日期：** 2026-06-18

---

## 1. 預設 headers

多數 Vedur 請求可使用：

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

NOAA 極光請求通常只需要：

```http
Accept: application/json
```

---

## 2. 快速測試順序

### 極光流程

1. https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
2. https://api.vedur.is/weather/openapi.json
3. https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
4. https://api.vedur.is/weather/stations?region_id=12
5. https://vedur.is/vedur/spar/nordurljos/

### 道路風險流程

1. https://api.vedur.is/weather/openapi.json
2. https://api.vedur.is/weather/capabilities
3. https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
4. https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic
5. https://api.vedur.is/weather/stations?region_id=12

---

## 3. 回應格式提醒

### NOAA 極光

- JSON 物件
- 包含觀測時間、預報時間與座標網格
- 適合地圖展示與分數計算邏輯

### Vedur 測站資料

- JSON 陣列（測站物件）
- 每筆通常含測站名稱、位置、類型與狀態

### Vedur 觀測資料

- JSON 陣列（觀測物件）
- 欄位會依 AWS 或 SYNOP 端點不同而變化

---

## 4. 常用規則

- 全國測試先用 `region_id=12`
- 優先使用 `parameters=basic`
- 需要完整參數時回查 OpenAPI 文件
- 網頁型來源預設視為參考，除非能穩定回傳 JSON
