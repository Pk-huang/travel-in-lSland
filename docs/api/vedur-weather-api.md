# Vedur 天氣 API

**Base URL：** https://api.vedur.is/weather  
**OpenAPI：** https://api.vedur.is/weather/openapi.json  
**API 版本 header：** `X-Vi-Api-Version: 2026-02-17`

---

## 1. 這個 API 的用途

Vedur 是冰島主要官方氣象來源，特別適合以下用途：

- 測站中繼資料
- 最新氣象觀測
- 依時間區間彙整的天氣資料
- 天氣預警與預報相關背景
- 與道路風險高度相關的訊號（風、雨、雪、能見度）

---

## 2. 重要限制

- 這是氣象 API，不是交通事件 API。
- 不能取代官方道路封閉資料。
- 部分端點需在 `station_id`、`region_id`、`polygon` 間擇一。
- `parameters=basic` 對 MVP 通常已足夠。
- `parameters=all` 會回傳更多欄位，但 payload 較大。

---

## 3. 可直接用於 Postman 的端點

### 3.1 OpenAPI 文件

- **GET** https://api.vedur.is/weather/openapi.json

若需要完整 schema，建議先呼叫此端點。

### 3.2 Capabilities

- **GET** https://api.vedur.is/weather/capabilities

顯示可用端點能力清單。

### 3.3 Stations

- **GET** https://api.vedur.is/weather/stations?region_id=12

回傳全國範圍測站資料。

### 3.4 最新 AWS 觀測

- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic

### 3.5 最新 SYNOP 觀測

- **GET** https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic

---

## 4. 建議 headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 5. JSON 結構範例

### 5.1 測站回應

```json
{
  "station": 1475,
  "name": "Reykjavík",
  "abbr": "reitr",
  "type": "sj",
  "lat": 64.12755,
  "lon": -21.902,
  "ele": 52,
  "wigos": "0-20000-0-04130",
  "owner": "Vedur",
  "start": 1949,
  "ending": null
}
```

### 5.2 AWS 最新觀測

```json
[
  {
    "station": 1475,
    "name": "Reykjavík",
    "time": "2026-06-18T12:00:00Z",
    "t": 12.5,
    "f": 8.1,
    "fg": 12.4,
    "d_txt": "NW",
    "rh": 68,
    "r": 0.0,
    "snd": 0,
    "ps": 1005.2
  }
]
```

### 5.3 SYNOP 最新觀測

```json
[
  {
    "station": 1,
    "name": "Reykjavík",
    "time": "2026-06-18T12:00:00Z",
    "t": 11.8,
    "tw": 10.7,
    "rh": 71,
    "f": 7.4,
    "d_txt_is": "NV",
    "p": 1004.8,
    "sun": 0,
    "snd": 0
  }
]
```

---

## 6. 欄位對照

### 核心道路風險欄位

| 欄位 | 意義 | 重要原因 |
|---|---|---|
| `t` | 氣溫 | 結冰／霜凍風險 |
| `f` | 風速 | 行駛穩定性 |
| `fg` | 陣風 | 突發危險 |
| `d_txt` / `d_txt_is` | 風向文字 | 開闊路段受風風險 |
| `rh` | 相對濕度 | 霧／結霜背景 |
| `r` | 降水量 | 濕滑／降雪風險 |
| `snd` | 積雪深度 | 冬季道路條件 |
| `ps` / `p` | 氣壓 | 風暴背景判斷 |
| `sun` | 日照相關值 | 白天時段／能見度背景 |

### 常用測站／區域參數

- `station_id`：指定測站
- `region_id`：冰島預報區域
- `polygon`：以 WKT 多邊形做地理篩選

---

## 7. Region ID 對照

| 區域 | 數值 |
|---|---:|
| Höfuðborgarsvæðið | 1 |
| Suðurland | 2 |
| Faxaflói | 3 |
| Breiðafjörður | 4 |
| Vestfirðir | 5 |
| Strandir og norðurland vestra | 6 |
| Norðurland eystra | 7 |
| Austurland að Glettingi | 8 |
| Austfirðir | 9 |
| Suðausturland | 10 |
| Miðhálendi | 11 |
| Allt landið | 12 |

---

## 8. 建議 MVP 使用方式

若專案目標是道路風險或旅遊安全，這個 API 可支援：

- 結冰風險提醒
- 風暴風險提醒
- 雨雪影響訊號
- 區域層級摘要卡片
- 測站層級細節頁面

---

## 9. 實務建議

- 先用 `parameters=basic`。
- 先從 `region_id=12`（全國）開始驗證。
- 需要在地精度時，再切換到特定測站。
- 在確認端點穩定前，建議先保持精簡回應欄位。
