# 冰島交通／道路資料研究

**更新日期：** 2026-06-18

---

## 1. 快速結論

冰島道路與交通資料的公開 API 目前相對有限。

現階段最可行的來源組合：

- **Vedur Weather API**：道路風險相關訊號
- **APIs.is**：社群彙整型資料入口
- **Umferdin**：公開網頁資訊參考
- **NOAA aurora**：僅在你同時需要極光功能時納入

目前尚未確認有穩定且公開的官方 API，可直接提供即時交通事件、道路封閉或壅塞資料。

---

## 2. 主要來源

### 2.1 Vedur Weather API

- **Base:** https://api.vedur.is/weather
- **OpenAPI:** https://api.vedur.is/weather/openapi.json
- **用途：** 影響行車安全的天氣條件
- **優勢：** 官方、結構化、穩定性高

### 2.2 APIs.is

- **Base:** https://apis.is/
- **Docs:** https://docs.apis.is/
- **用途：** 天氣、航班、地震、公車、油價、地址等公開資料彙整
- **優勢：** 多類型資料集中於同一入口
- **注意：** 屬社群彙整，不一定是資料官方原始來源

### 2.3 Umferdin / 道路主管機關資訊

- **Web:** https://umferdin.is/
- **用途：** 網頁上的交通事件、封閉資訊與道路公告
- **注意：** 尚未確認穩定、文件化的公開 API

---

## 3. 各來源擅長範圍

| 來源 | 適用場景 | 限制 |
|---|---|---|
| Vedur | 道路風險、天氣、預警 | 不提供交通事件細節 |
| APIs.is | 快速整合公開資料 | 非官方來源、交通深度有限 |
| Umferdin | 網頁上的封路與事件資訊 | 以網頁為主，API 不明確 |

---

## 4. Vedur 的道路風險欄位

以下欄位對道路安全判斷最實用：

| 欄位 | 說明 |
|---|---|
| `t` | 氣溫 |
| `f` | 風速 |
| `fg` | 陣風 |
| `d_txt` / `d_txt_is` | 風向文字 |
| `rh` | 相對濕度 |
| `r` | 降水 |
| `snd` | 積雪深度 |
| `ps` / `p` | 氣壓 |
| `sun` | 日照／能見度相關背景 |

---

## 5. Postman 可直接測試的 URL

### Vedur 端點

- **GET** https://api.vedur.is/weather/openapi.json
- **GET** https://api.vedur.is/weather/capabilities
- **GET** https://api.vedur.is/weather/stations?region_id=12
- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
- **GET** https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic

### APIs.is 端點

- **GET** https://apis.is/
- **GET** https://docs.api.is/

### Umferdin 端點

- **GET** https://umferdin.is/

---

## 6. 建議 headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 7. 已知限制

- 尚未確認公開交通事件 API
- 尚未確認公開道路封閉 API
- 尚未確認公開壅塞 API
- 尚未確認公開道路攝影機 API
- APIs.is 有公車資料，但目前 MVP 可選用，非必要

---

## 8. 建議 MVP 範圍

若目前只需要道路風險判斷，第一版僅用 Vedur 即可。

若後續要做即時交通事件，通常需要再加第二來源或網頁擷取。

---

## 9. 下一步建議

若專案規模擴大，建議再細分子資料夾，例如：

- weather
- traffic
- aurora
- flights
- public-transport

目前這個資料夾作為第一階段 API 研究集中區是合適的。
